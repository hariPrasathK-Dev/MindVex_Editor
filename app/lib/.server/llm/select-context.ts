import { generateText, type CoreTool, type GenerateTextResult, type Message } from 'ai';
import ignore from 'ignore';
import type { IProviderSetting } from '~/types/model';
import { IGNORE_PATTERNS, type FileMap } from './constants';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { createFilesContext, extractCurrentContext, extractPropertiesFromMessage, simplifyBoltActions } from './utils';
import { createScopedLogger } from '~/utils/logger';
import { LLMManager } from '~/lib/modules/llm/manager';

// Common patterns to ignore, similar to .gitignore

const ig = ignore().add(IGNORE_PATTERNS);
const logger = createScopedLogger('select-context');

export async function selectContext(props: {
  messages: Message[];
  env?: Env;
  apiKeys?: Record<string, string>;
  files: FileMap;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  summary: string;
  onFinish?: (resp: GenerateTextResult<Record<string, CoreTool<any, any>>, never>) => void;
}) {
  const { messages, env: serverEnv, apiKeys, files, providerSettings, summary, onFinish } = props;
  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;

      return { ...message, content };
    } else if (message.role == 'assistant') {
      let content = message.content;

      content = simplifyBoltActions(content);

      content = content.replace(/<div class=\\"__mindvexThought__\\">.*?<\/div>/s, '');
      content = content.replace(/<think>.*?<\/think>/s, '');

      return { ...message, content };
    }

    return message;
  });

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
  const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      // Fallback to first model
      logger.warn(
        `MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`,
      );
      modelDetails = modelsList[0];
    }
  }

  const { codeContext } = extractCurrentContext(processedMessages);

  let filePaths = getFilePaths(files || {});
  filePaths = filePaths.filter((x) => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });

  let context = '';
  const currrentFiles: string[] = [];
  const contextFiles: FileMap = {};

  if (codeContext?.type === 'codeContext') {
    const codeContextFiles: string[] = codeContext.files;
    Object.keys(files || {}).forEach((path) => {
      let relativePath = path;

      if (path.startsWith('/home/project/')) {
        relativePath = path.replace('/home/project/', '');
      }

      if (codeContextFiles.includes(relativePath)) {
        contextFiles[relativePath] = files[path];
        currrentFiles.push(relativePath);
      }
    });
    context = createFilesContext(contextFiles);
  }

  const summaryText = `Here is the summary of the chat till now: ${summary}`;

  const extractTextContent = (message: Message) =>
    Array.isArray(message.content)
      ? (message.content.find((item) => item.type === 'text')?.text as string) || ''
      : message.content;

  const lastUserMessage = processedMessages.filter((x) => x.role == 'user').pop();

  if (!lastUserMessage) {
    throw new Error('No user message found');
  }

  // Check if the user's query is simple (e.g., just saying hi) to avoid unnecessary context expansion
  const userQuestion = extractTextContent(lastUserMessage);
  const isSimpleQuery = userQuestion
    .trim()
    .toLowerCase()
    .match(
      /^(hi|hello|hola|hey|good morning|good afternoon|good evening|good day|greetings|bonjour|ciao|salut|hallo|ola|namaste|bye|goodbye|adios|au revoir|sayonara|see you|talk to you later)$/,
    );

  // If it's a simple query, don't select additional files - just return the existing context files
  if (isSimpleQuery) {
    logger.info('Simple query detected, returning existing context files without selection');

    const totalFiles = Object.keys(contextFiles).length;

    if (totalFiles == 0) {
      // For simple queries with no context, just return empty
      return {};
    }

    return contextFiles;
  }

  /*
   * Only proceed with context selection for more complex queries
   * select files from the list of code file from the project that might be useful for the current request from the user
   */
  const resp = await generateText({
    system: `
        You are a software engineer assistant. You are helping a user with their codebase. You have access to the following files:

        AVAILABLE FILES PATHS
        ---
        ${filePaths.map((path) => `- ${path}`).join('\n')}
        ---

        You have following code loaded in the context buffer that you can refer to:

        CURRENT CONTEXT BUFFER
        ---
        ${context}
        ---

        The user has asked a question about their code. You need to select the files that are relevant to answer the user's question from the list of files above.

        CRITICAL INSTRUCTIONS:
        - Prioritize source code files (.ts, .tsx, .js, .jsx, .py, .java, .cpp, .html, .css, etc.) over configuration files
        - Prioritize files that are directly related to the user's query
        - Consider dependencies and related modules when selecting files
        - If the user is asking about a specific feature, include the files that implement that feature
        - If the user is asking about an error, include the files where the error occurs or related files
        - Be very conservative with context - only include essential files to avoid token limits
        
        RESPONSE FORMAT:
        your response should be in following format:
---
<updateContextBuffer>
    <includeFile path="path/to/file"/>
    <excludeFile path="path/to/file"/>
</updateContextBuffer>
---
        * Your should start with <updateContextBuffer> and end with </updateContextBuffer>.
        * You can include multiple <includeFile> and <excludeFile> tags in the response.
        * You should not include any other text in the response.
        * You should not include any file that is not in the list of files above.
        * You should not include any file that is already in the context buffer.
        * If no changes are needed, you can leave the response empty updateContextBuffer tag.
        `,
    prompt: `
        ${summaryText}

        Users Question: ${userQuestion}

        update the context buffer with the files that are relevant to the task from the list of files above.

        CRITICAL RULES:
        * Only include relevant files in the context buffer.
        * context buffer should not include any file that is not in the list of files above.
        * context buffer is extremlly expensive, so only include files that are absolutely necessary.
        * If no changes are needed, you can leave the response empty updateContextBuffer tag.
        * Only 5 files can be placed in the context buffer at a time.
        * if the buffer is full, you need to exclude files that is not needed and include files that is relevent.

        `,
    model: provider.getModelInstance({
      model: currentModel,
      serverEnv,
      apiKeys,
      providerSettings,
    }),
  });

  const response = resp.text;
  const updateContextBuffer = response.match(/<updateContextBuffer>([\s\S]*?)<\/updateContextBuffer>/);

  if (!updateContextBuffer) {
    logger.warn('AI did not return properly formatted context selection, using preserved context files');

    // If the AI didn't return a properly formatted response, just return the preserved context files
    if (Object.keys(contextFiles).length > 0) {
      return contextFiles;
    }

    // Otherwise return an empty context
    return {};
  }

  const includeFiles =
    updateContextBuffer[1]
      .match(/<includeFile path="(.*?)"/gm)
      ?.map((x) => x.replace('<includeFile path="', '').replace('"', '')) || [];
  const excludeFiles =
    updateContextBuffer[1]
      .match(/<excludeFile path="(.*?)"/gm)
      ?.map((x) => x.replace('<excludeFile path="', '').replace('"', '')) || [];

  const filteredFiles: FileMap = {};
  excludeFiles.forEach((path) => {
    delete contextFiles[path];
  });
  includeFiles.forEach((path) => {
    let fullPath = path;

    if (!path.startsWith('/home/project/')) {
      fullPath = `/home/project/${path}`;
    }

    if (!filePaths.includes(fullPath)) {
      logger.error(`File ${path} is not in the list of files above.`);
      return;

      // throw new Error(`File ${path} is not in the list of files above.`);
    }

    if (currrentFiles.includes(path)) {
      return;
    }

    filteredFiles[path] = files[fullPath];
  });

  if (onFinish) {
    onFinish(resp);
  }

  /*
   * Preserve user-provided context files (from Add Context button) in addition to AI-selected files
   * This ensures that when users explicitly select files, those files are always included
   */
  const preservedContextFiles = { ...contextFiles }; // Copy existing context files

  // Add user-provided context files that weren't selected by AI (to preserve user intent)
  Object.keys(preservedContextFiles).forEach((path) => {
    if (!filteredFiles[path]) {
      /*
       * If the user-provided file wasn't selected by AI, add it anyway
       * Need to get the full path for the files object
       */
      let fullPath = path;

      if (!path.startsWith('/home/project/')) {
        fullPath = `/home/project/${path}`;
      }

      if (files[fullPath]) {
        filteredFiles[path] = files[fullPath];
      }
    }
  });

  const totalFiles = Object.keys(filteredFiles).length;
  logger.info(`Total files: ${totalFiles}`);

  if (totalFiles == 0) {
    // Even if AI didn't select any files, if there were user-provided context files, use them
    if (Object.keys(preservedContextFiles).length > 0) {
      return preservedContextFiles;
    }

    /*
     * For simple queries or when no files are relevant, return empty context instead of failing
     * This allows the AI to respond based on general knowledge without code context
     */
    logger.warn('No files selected for context, returning empty context');

    return {};
  }

  return filteredFiles;

  // generateText({
}

export function getFilePaths(files: FileMap) {
  let filePaths = Object.keys(files);
  filePaths = filePaths.filter((x) => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });

  return filePaths;
}
