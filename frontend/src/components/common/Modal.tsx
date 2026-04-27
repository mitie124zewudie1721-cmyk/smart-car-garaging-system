// src/components/common/Modal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, type ReactNode } from 'react';
import { X } from 'lucide-react'; // for close icon (install: npm install lucide-react)
import Button from './Button';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean; // new: click outside to close
    className?: string;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdropClick = true,
    className = '',
}: ModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={closeOnBackdropClick ? onClose : () => { }}
            >
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                {/* Panel wrapper */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        {/* Panel */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={cn(
                                    'w-full transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left align-middle shadow-2xl transition-all',
                                    sizeClasses[size],
                                    'max-h-[90vh] overflow-y-auto',
                                    className
                                )}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {title}
                                    </Dialog.Title>

                                    {showCloseButton && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={onClose}
                                            aria-label="Close modal"
                                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="px-6 py-5">{children}</div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}