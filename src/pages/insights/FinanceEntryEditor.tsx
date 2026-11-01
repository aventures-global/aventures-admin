import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FinanceEntryForm from '../../components/finance/FinanceEntryForm'
import Notice from '../../components/cms/faqs/Notice'
import { useCreateFinanceEntry, useFinanceCategories } from '../../hooks/useFinance'
import { useNotice } from '../../hooks/useNotice'
import { useAuth } from '../../lib/authContext'
import { ghostActionClass } from '../../lib/formStyles'

export default function FinanceEntryEditor() {
    const { can } = useAuth()
    const canManage = can('finance.manage')
    const navigate = useNavigate()
    const [notice, setNotice] = useNotice()
    const categories = useFinanceCategories(false, canManage)
    const createEntry = useCreateFinanceEntry()
    const busy = createEntry.isPending

    const close = () => {
        if (busy) return
        navigate('..')
    }

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) close()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [busy]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-royal/30 p-4 font-poppins backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={close}
            >
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="finance-entry-dialog-title"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    onClick={(event) => event.stopPropagation()}
                    className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[3px] border border-royal/15 bg-cream p-5 shadow-[0_24px_60px_rgba(22,55,101,0.2)]"
                >
                    <h2 id="finance-entry-dialog-title" className="text-lg font-semibold text-ink">
                        New ledger entry
                    </h2>
                    <p className="mt-1 text-sm text-ink/55">
                        Add a manual income or expense. Customer payments are recorded under Payments.
                    </p>

                    {!canManage ? (
                        <div className="mt-5 space-y-4">
                            <p className="text-sm text-ink/65">
                                You do not have permission to add ledger entries.
                            </p>
                            <button type="button" className={ghostActionClass} onClick={close}>
                                Close
                            </button>
                        </div>
                    ) : (
                        <div className="mt-5 space-y-4">
                            <Notice notice={notice} />
                            <FinanceEntryForm
                                categories={categories.data ?? []}
                                busy={busy}
                                onCancel={close}
                                onSubmit={(input) =>
                                    createEntry.mutate(input, {
                                        onSuccess: () => navigate('..', { state: { financeNotice: 'Entry saved' } }),
                                        onError: (err) => setNotice({ tone: 'error', text: err.message }),
                                    })
                                }
                            />
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
