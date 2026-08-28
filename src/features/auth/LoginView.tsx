/**
 * LoginView.tsx  (Phase 3 — Premium Redesign)
 *
 * What changed vs original:
 *  ✅ All auth logic (loginWithGoogle, showToast) 100% preserved
 *  ✅ All feature copy preserved
 *  + 3D scene background (lazy-loaded LoginScene)
 *  + Glassmorphism card with backdrop-blur
 *  + Letter-by-letter brand name animation
 *  + Staggered feature item reveals
 *  + Gradient mesh animated background
 *  + GlowButton with magnetic + shimmer effect
 *  + Shimmer progress bar while loading
 *  + Gradient text on brand tagline
 */
import React, { useState, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { GlowButton } from '@/components/ui/GlowButton'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { ShieldCheck, Zap, Users, Sparkles } from 'lucide-react'

// Lazy-load the heavy Three.js scene — not in main bundle
const LoginScene = lazy(() => import('@/components/three/LoginScene'))

/* ─── Stagger variants ─── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

/* ─── Individual letter animation ─── */
const letterVariants = {
  hidden: { opacity: 0, y: 18, rotateX: -45 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

const BRAND_LETTERS = 'Oweo'.split('')

const features = [
  {
    icon: Zap,
    color: 'bg-primary/10 text-primary',
    title: 'Lightning-Fast Entry',
    desc: 'Type "180 dinner" or tap categories. No endless forms.',
  },
  {
    icon: Users,
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    title: 'Smart Debt Simplification',
    desc: 'Split trips & dinners. Settle circular debts with minimal transfers.',
  },
  {
    icon: Sparkles,
    color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    title: 'Offline & Private',
    desc: 'Works seamlessly without internet. Zero bank credentials needed.',
  },
]

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
)

export const LoginView: React.FC = () => {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle()
      showToast('Welcome to Oweo!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in'
      showToast(msg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-3.5 xs:p-4 sm:p-6 overflow-y-auto overscroll-contain py-6 sm:py-8">
      {/* ── Animated gradient mesh background ── */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(173 80% 36% / 0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 85% 80%, hsl(168 84% 60% / 0.10) 0%, transparent 65%), hsl(var(--background))',
        }}
      />

      {/* ── 3D Scene (lazy-loaded) — no fallback flash ── */}
      <Suspense fallback={null}>
        <LoginScene />
      </Suspense>

      {/* ── Content card ── */}
      <motion.div
        className="relative w-full max-w-md z-10 my-auto"
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Glassmorphism card */}
        <div
          className="rounded-3xl p-5 xs:p-6 sm:p-7 space-y-5 sm:space-y-6"
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            background: 'hsl(var(--card) / 0.82)',
            border: '1px solid hsl(var(--border) / 0.6)',
            boxShadow:
              '0 24px 64px -16px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* ── Brand header ── */}
          <motion.div
            className="text-center space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo mark with glow-breathe */}
            <motion.div
              className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center font-black text-3xl mx-auto shadow-xl shadow-primary/30 animation-glow-breathe"
              variants={itemVariants}
              whileHover={{ scale: 1.08, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ animationName: 'glow-breathe', animationDuration: '3s', animationIterationCount: 'infinite' }}
            >
              ₹
            </motion.div>

            {/* Animated brand name */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-center" aria-label="Oweo">
                {BRAND_LETTERS.map((letter, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={letterVariants}
                    className="text-4xl font-black tracking-tight text-foreground inline-block"
                    style={{ perspective: 400 }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
              <p className="text-sm font-semibold mt-1 gradient-text">
                Personal Expenses + Group Splits
              </p>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto"
            >
              Know where your money went and who owes whom in seconds.
              Fast, offline-first, India-ready.
            </motion.p>
          </motion.div>

          {/* ── Feature highlights ── */}
          <motion.div
            className="space-y-3.5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {features.map(({ icon: Icon, color, title, desc }) => (
              <motion.div
                key={title}
                className="flex items-center gap-3"
                variants={itemVariants}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <motion.div
                  className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}
                  whileHover={{ scale: 1.12, rotate: -5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{title}</h4>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Google sign-in ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="pt-3 border-t border-border/60"
          >
            <GlowButton
              onClick={handleGoogleLogin}
              isLoading={isLoading}
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm font-bold h-12"
              leftIcon={<GoogleIcon />}
            >
              Continue with Google
            </GlowButton>
          </motion.div>
        </div>

        {/* ── Security footnote ── */}
        <motion.div
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Strictly expense tracking • No payment processing</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
