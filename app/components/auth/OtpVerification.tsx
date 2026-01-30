import { useState, useEffect, useRef, useCallback } from 'react';
import { backendApi } from '~/lib/services/backendApiService';
import { toast } from 'react-toastify';

interface OtpVerificationProps {
    email: string;
    maskedEmail: string;
    type: 'login' | 'registration';
    onVerified: (token: string, user: any) => void;
    onCancel: () => void;
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

export function OtpVerification({
    email,
    maskedEmail,
    type,
    onVerified,
    onCancel,
}: OtpVerificationProps) {
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format countdown time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle input change
    const handleChange = (index: number, value: string) => {
        // Only accept digits
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take only last character
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are entered
        if (newOtp.every((digit) => digit) && newOtp.join('').length === OTP_LENGTH) {
            handleVerify(newOtp.join(''));
        }
    };

    // Handle backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, OTP_LENGTH);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, i) => {
            if (i < OTP_LENGTH) newOtp[i] = char;
        });
        setOtp(newOtp);

        // Focus last filled input or first empty
        const lastFilledIndex = Math.min(pastedData.length - 1, OTP_LENGTH - 1);
        inputRefs.current[lastFilledIndex]?.focus();

        // Auto-submit if complete
        if (pastedData.length === OTP_LENGTH) {
            handleVerify(pastedData);
        }
    };

    // Verify OTP
    const handleVerify = useCallback(
        async (otpCode: string) => {
            if (otpCode.length !== OTP_LENGTH) {
                toast.error('Please enter the complete verification code');
                return;
            }

            setIsLoading(true);
            try {
                const response = await backendApi.verifyOtp(email, otpCode, type);
                toast.success(
                    type === 'registration'
                        ? 'Account created successfully!'
                        : 'Login successful!'
                );
                onVerified(response.token, response.user);
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Invalid verification code. Please try again.'
                );
                // Clear OTP on error
                setOtp(Array(OTP_LENGTH).fill(''));
                inputRefs.current[0]?.focus();
            } finally {
                setIsLoading(false);
            }
        },
        [email, type, onVerified]
    );

    // Resend OTP
    const handleResend = async () => {
        setIsResending(true);
        try {
            await backendApi.resendOtp(email, type);
            toast.success('New verification code sent!');
            setCountdown(OTP_EXPIRY_SECONDS);
            setCanResend(false);
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to resend code'
            );
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-mindvex-elements-background-depth-2 rounded-lg shadow-2xl border border-mindvex-elements-borderColor">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-500/10"
                    aria-label="Cancel"
                >
                    <div className="i-ph:x text-xl" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-[#ff6b35]/10 rounded-full flex items-center justify-center">
                            <div className="i-ph:shield-check text-3xl text-[#ff6b35]" />
                        </div>
                        <h2 className="text-2xl font-bold text-mindvex-elements-textPrimary mb-2">
                            Verify Your Email
                        </h2>
                        <p className="text-mindvex-elements-textSecondary text-sm">
                            We've sent a 6-digit code to
                        </p>
                        <p className="text-mindvex-elements-textPrimary font-medium">
                            {maskedEmail}
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-3 mb-6">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                disabled={isLoading}
                                className="w-12 h-14 text-center text-2xl font-bold bg-mindvex-elements-background-depth-1 border border-mindvex-elements-borderColor rounded-lg text-mindvex-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition-all disabled:opacity-50"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {/* Timer */}
                    <div className="text-center mb-6">
                        {countdown > 0 ? (
                            <p className="text-mindvex-elements-textSecondary text-sm">
                                Code expires in{' '}
                                <span className="font-mono text-[#ff6b35]">
                                    {formatTime(countdown)}
                                </span>
                            </p>
                        ) : (
                            <p className="text-red-500 text-sm">
                                Code has expired. Please request a new one.
                            </p>
                        )}
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={() => handleVerify(otp.join(''))}
                        disabled={isLoading || otp.some((d) => !d)}
                        className="w-full py-3 bg-mindvex-elements-button-primary-background hover:bg-mindvex-elements-button-primary-backgroundHover text-mindvex-elements-button-primary-text font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="i-ph:spinner animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <span>Verify Code</span>
                        )}
                    </button>

                    {/* Resend */}
                    <div className="mt-6 text-center">
                        <span className="text-sm text-mindvex-elements-textSecondary">
                            Didn't receive the code?{' '}
                        </span>
                        <button
                            onClick={handleResend}
                            disabled={!canResend || isResending}
                            className="text-sm font-medium text-[#ff6b35] hover:text-[#ff8c61] transition-colors disabled:text-mindvex-elements-textSecondary disabled:cursor-not-allowed"
                        >
                            {isResending ? 'Sending...' : 'Resend Code'}
                        </button>
                    </div>

                    {/* Back button */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={onCancel}
                            className="text-sm text-mindvex-elements-textSecondary hover:text-mindvex-elements-textPrimary transition-colors"
                        >
                            ← Back to {type === 'registration' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
