import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import BrandWordmark from '../BrandWordmark'
import Sidebar from './Sidebar'

export default function AdminLayout() {
    const [drawerOpen, setDrawerOpen] = useState(false)

    useEffect(() => {
        if (!drawerOpen) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setDrawerOpen(false)
        }
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [drawerOpen])

    const closeDrawer = () => setDrawerOpen(false)

    return (
        <div className="luxury-paper min-h-svh font-poppins">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-royal/10 bg-cream lg:block">
                <Sidebar />
            </aside>

            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-royal/10 bg-oat/90 px-4 py-2 shadow-[0_8px_30px_rgba(22,55,101,0.06)] backdrop-blur-md lg:hidden">
                <Link to="/" aria-label="AVENtures admin home">
                    <BrandWordmark className="text-lg" />
                </Link>
                <button
                    type="button"
                    aria-label="Open menu"
                    aria-expanded={drawerOpen}
                    onClick={() => setDrawerOpen(true)}
                    className="-mr-1 flex min-h-10 min-w-10 items-center justify-center rounded-[3px] text-ink transition-colors hover:text-royal"
                >
                    <Menu size={20} strokeWidth={1.5} />
                </button>
            </header>

            <AnimatePresence>
                {drawerOpen ? (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-royal/25 backdrop-blur-sm lg:hidden"
                            onClick={closeDrawer}
                            aria-hidden
                        />
                        <motion.aside
                            key="drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="fixed inset-y-0 left-0 z-50 w-60 max-w-[80vw] border-r border-royal/10 bg-cream shadow-[0_18px_40px_rgba(22,55,101,0.14)] lg:hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation"
                        >
                            <button
                                type="button"
                                aria-label="Close menu"
                                onClick={closeDrawer}
                                className="absolute top-3 right-2 flex min-h-9 min-w-9 items-center justify-center rounded-[3px] text-ink/70 transition-colors hover:text-royal"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                            <Sidebar onNavigate={closeDrawer} />
                        </motion.aside>
                    </>
                ) : null}
            </AnimatePresence>

            <main className="lg:pl-56">
                <div className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
