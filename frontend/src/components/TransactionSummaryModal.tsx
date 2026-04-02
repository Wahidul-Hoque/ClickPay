import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TransactionSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    accountLabel?: string;
    account: string;
    amount: string | number;
    charge: string | number;
    transactionId: string;
    reference?: string;
    time?: string;
}

export function TransactionSummaryModal({
    isOpen,
    onClose,
    title,
    accountLabel = 'Account',
    account,
    amount,
    charge,
    transactionId,
    reference = '',
    time,
}: TransactionSummaryProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(transactionId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayTime = time || new Date().toLocaleString('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: true,
        day: '2-digit', month: '2-digit', year: '2-digit'
    }).replace(',', '');

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/50 animate-fadeIn p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slideUp">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-medium text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-rose-600 font-medium text-sm hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>

                {/* Grid Container */}
                <div className="grid grid-cols-2 text-left">
                    {/* Row 1 */}
                    <div className="p-4 border-b border-r border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">{accountLabel}</p>
                        <p className="text-[15px] font-medium text-slate-800">{account}</p>
                    </div>
                    <div className="p-4 border-b border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Time</p>
                        <p className="text-[15px] font-medium text-slate-800">{displayTime.toLowerCase()}</p>
                    </div>

                    {/* Row 2 */}
                    <div className="p-4 border-b border-r border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Amount</p>
                        <p className="text-[15px] font-medium text-slate-800">৳{(Number(amount) || 0).toFixed(2)}</p>
                    </div>
                    <div className="p-4 border-b border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Charge</p>
                        <p className="text-[15px] font-medium text-slate-800">৳{(Number(charge) || 0).toFixed(2)}</p>
                    </div>

                    {/* Row 3 */}
                    <div className="p-4 border-r border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Transaction ID</p>
                        <div className="flex items-center gap-2">
                            <p className="text-[15px] font-medium text-slate-800 uppercase tracking-wide truncate">{'---'}</p>
                            <button onClick={handleCopy} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                        <p className="text-xs text-slate-500 mb-1">Reference</p>
                        <p className="text-[15px] font-medium text-slate-800 truncate">{reference || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
