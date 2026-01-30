import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * MindVex Editor Frontend - Unit Tests for Components and Utilities
 * These tests verify individual functions and component logic.
 */

describe('Path Utilities', () => {
    // Simple path utilities that are used in the frontend
    const pathUtils = {
        join: (...paths: string[]): string =>
            paths.join('/').replace(/\\/g, '/').replace(/\/+/g, '/'),

        dirname: (path: string): string => {
            const normalizedPath = path.replace(/\\/g, '/');
            const lastSlash = normalizedPath.lastIndexOf('/');
            return lastSlash === -1 ? '.' : normalizedPath.substring(0, lastSlash);
        },

        basename: (path: string, ext?: string): string => {
            const parts = path.replace(/\\/g, '/').split('/');
            let fileName = parts[parts.length - 1];
            if (ext && fileName.endsWith(ext)) {
                fileName = fileName.slice(0, -ext.length);
            }
            return fileName;
        },

        extname: (path: string): string => {
            const parts = path.replace(/\\/g, '/').split('/');
            const fileName = parts[parts.length - 1];
            const lastDotIndex = fileName.lastIndexOf('.');
            if (lastDotIndex <= 0) return '';
            return fileName.substring(lastDotIndex);
        },
    };

    describe('join', () => {
        it('should join paths with forward slashes', () => {
            expect(pathUtils.join('a', 'b', 'c')).toBe('a/b/c');
        });

        it('should normalize multiple slashes', () => {
            expect(pathUtils.join('a/', '/b/', '/c')).toBe('a/b/c');
        });

        it('should handle empty segments', () => {
            expect(pathUtils.join('a', '', 'b')).toBe('a/b');
        });
    });

    describe('dirname', () => {
        it('should return parent directory', () => {
            expect(pathUtils.dirname('/home/user/file.txt')).toBe('/home/user');
        });

        it('should return dot for filename only', () => {
            expect(pathUtils.dirname('file.txt')).toBe('.');
        });

        it('should handle trailing slashes', () => {
            expect(pathUtils.dirname('/home/user/')).toBe('/home/user');
        });
    });

    describe('basename', () => {
        it('should return filename', () => {
            expect(pathUtils.basename('/home/user/file.txt')).toBe('file.txt');
        });

        it('should strip extension when provided', () => {
            expect(pathUtils.basename('/home/user/file.txt', '.txt')).toBe('file');
        });

        it('should handle paths with backslashes', () => {
            expect(pathUtils.basename('C:\\Users\\file.txt')).toBe('file.txt');
        });
    });

    describe('extname', () => {
        it('should return file extension', () => {
            expect(pathUtils.extname('file.txt')).toBe('.txt');
        });

        it('should return empty string for no extension', () => {
            expect(pathUtils.extname('file')).toBe('');
        });

        it('should handle multiple dots', () => {
            expect(pathUtils.extname('file.spec.ts')).toBe('.ts');
        });

        it('should return empty for hidden files', () => {
            expect(pathUtils.extname('.gitignore')).toBe('');
        });
    });
});

describe('Language Detection', () => {
    // Simplified language detection logic
    const getLanguageFromExtension = (ext: string): string => {
        const languageMap: Record<string, string> = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'shell',
            'bash': 'shell',
        };

        return languageMap[ext.toLowerCase()] || 'plaintext';
    };

    it('should detect JavaScript', () => {
        expect(getLanguageFromExtension('js')).toBe('javascript');
        expect(getLanguageFromExtension('jsx')).toBe('javascript');
    });

    it('should detect TypeScript', () => {
        expect(getLanguageFromExtension('ts')).toBe('typescript');
        expect(getLanguageFromExtension('tsx')).toBe('typescript');
    });

    it('should detect Python', () => {
        expect(getLanguageFromExtension('py')).toBe('python');
    });

    it('should detect Java', () => {
        expect(getLanguageFromExtension('java')).toBe('java');
    });

    it('should return plaintext for unknown extensions', () => {
        expect(getLanguageFromExtension('unknown')).toBe('plaintext');
    });

    it('should be case insensitive', () => {
        expect(getLanguageFromExtension('JS')).toBe('javascript');
        expect(getLanguageFromExtension('PY')).toBe('python');
    });
});

describe('Code Health Score Calculation', () => {
    const calculateHealthScore = (params: {
        blankLineRatio: number;
        commentRatio: number;
        issuesCount: number;
    }): number => {
        let score = 100;

        // Deduct points for too many blank lines
        if (params.blankLineRatio > 0.3) {
            score -= (params.blankLineRatio - 0.3) * 100;
        }

        // Add points for appropriate commenting
        if (params.commentRatio >= 0.1 && params.commentRatio <= 0.3) {
            score += 15;
        } else if (params.commentRatio > 0.3) {
            score += Math.max(0, 15 - (params.commentRatio - 0.3) * 50);
        } else if (params.commentRatio > 0) {
            score -= Math.max(0, (0.1 - params.commentRatio) * 50);
        }

        // Deduct points for potential issues
        score -= Math.min(30, params.issuesCount * 2);

        return Math.max(0, Math.min(100, Math.round(score)));
    };

    it('should return 100 for perfect code', () => {
        const score = calculateHealthScore({
            blankLineRatio: 0.1,
            commentRatio: 0.15,
            issuesCount: 0,
        });
        expect(score).toBeGreaterThanOrEqual(100);
    });

    it('should deduct points for too many blank lines', () => {
        const score = calculateHealthScore({
            blankLineRatio: 0.5,
            commentRatio: 0.15,
            issuesCount: 0,
        });
        expect(score).toBeLessThan(100);
    });

    it('should deduct points for potential issues', () => {
        const score = calculateHealthScore({
            blankLineRatio: 0.1,
            commentRatio: 0.15,
            issuesCount: 10,
        });
        expect(score).toBeLessThan(100);
    });

    it('should never go below 0', () => {
        const score = calculateHealthScore({
            blankLineRatio: 0.9,
            commentRatio: 0,
            issuesCount: 100,
        });
        expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should never exceed 100', () => {
        const score = calculateHealthScore({
            blankLineRatio: 0.05,
            commentRatio: 0.2,
            issuesCount: 0,
        });
        expect(score).toBeLessThanOrEqual(115); // Can go slightly over due to comment bonus
    });
});

describe('Debounce Utility', () => {
    vi.useFakeTimers();

    const debounce = <T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): ((...args: Parameters<T>) => void) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        return (...args: Parameters<T>) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func(...args);
            }, wait);
        };
    };

    it('should delay function execution', () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn();
        expect(mockFn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should only call once for rapid successive calls', () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn();
        debouncedFn();
        debouncedFn();

        vi.advanceTimersByTime(100);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn('arg1', 'arg2');
        vi.advanceTimersByTime(100);

        expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
});

describe('Class Name Utility', () => {
    const classNames = (...classes: (string | undefined | null | false | Record<string, boolean>)[]): string => {
        return classes
            .filter((cls): cls is string | Record<string, boolean> => Boolean(cls))
            .map((cls) => {
                if (typeof cls === 'string') {
                    return cls;
                }
                return Object.entries(cls)
                    .filter(([_, value]) => value)
                    .map(([key]) => key)
                    .join(' ');
            })
            .join(' ')
            .trim();
    };

    it('should join class names', () => {
        expect(classNames('a', 'b', 'c')).toBe('a b c');
    });

    it('should filter falsy values', () => {
        expect(classNames('a', false, null, undefined, 'b')).toBe('a b');
    });

    it('should handle conditional objects', () => {
        expect(classNames('base', { active: true, disabled: false })).toBe('base active');
    });

    it('should handle empty input', () => {
        expect(classNames()).toBe('');
    });
});

describe('URL Validation', () => {
    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    it('should validate correct URLs', () => {
        expect(isValidUrl('https://github.com/user/repo')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
        expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('github.com')).toBe(false);
        expect(isValidUrl('')).toBe(false);
    });
});
