import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Box, Building2, Users, Shield, Check, Diamond } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { LangSwitch } from '@/components/ui/LangSwitch';

const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => setAuth(data),
    onError: (error: any) => {
      const message = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
      alert(message);
    },
  });

  const onSubmit = (data: LoginForm) => loginMutation.mutate(data);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
      {/* LEFT — Enterprise Hero */}
      <div className="login-pattern relative overflow-hidden flex flex-col text-white">
        {/* Corner brackets */}
        <div className="corner-bracket top-6 left-6 border-t-2 border-l-2"></div>
        <div className="corner-bracket top-6 right-6 border-t-2 border-r-2"></div>
        <div className="corner-bracket bottom-6 left-6 border-b-2 border-l-2"></div>
        <div className="corner-bracket bottom-6 right-6 border-b-2 border-r-2"></div>

        <div className="relative z-10 p-14 pt-12 flex flex-col h-full">
          {/* Top — Status badges */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-steel-light">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-pulse-soft"></span>
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-green-400"></span>
              </span>
              SYSTEM OPERATIONAL
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-steel/70">
              <Shield className="w-3 h-3" />
              ENTERPRISE EDITION
            </div>
          </div>

          {/* Center — Brand Logo */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/15 blur-3xl scale-125 rounded-full" />
              <div className="relative" style={{ filter: 'drop-shadow(0 8px 32px rgba(183,153,13,0.25))' }}>
                <BrandLogo width={420} />
              </div>
            </div>
          </div>

          {/* Bottom — Headline + Stats */}
          <div>
            <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.22em] uppercase text-gold-2 mb-5">
              <span className="w-6 h-px bg-gold-2"></span>
              {t('login.eyebrow')}
            </div>
            <h1 className="font-serif italic text-[58px] leading-[0.95] mb-5 tracking-tight">
              <span className="font-display font-light not-italic text-white/95">{t('login.h1')}</span>
              <br />
              <em
                style={{
                  background: 'linear-gradient(180deg, #f0e1a3 0%, #d4b932 50%, #B7990D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('login.h2')}
              </em>
            </h1>
            <p className="text-steel-light/80 text-[14.5px] max-w-md leading-relaxed font-light">
              {t('login.sub')}
            </p>

            <div className="flex gap-10 mt-9 pt-7 border-t border-steel/15">
              {[
                { n: '2,874', l: t('login.items'), Icon: Box },
                { n: '3', l: t('login.branches'), Icon: Building2 },
                { n: '14', l: t('login.staff'), Icon: Users },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30 grid place-items-center text-gold-2 backdrop-blur-sm">
                    <s.Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="editorial-num text-[24px] text-white">{s.n}</div>
                    <div className="font-mono text-[10px] text-steel-light/65 tracking-[0.12em] uppercase mt-0.5">
                      {s.l}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="relative bg-gradient-to-br from-paper to-paper-2 grid place-items-center p-12">
        <div className="absolute top-8 right-8 flex items-center gap-3">
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-mute hidden lg:flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            SECURE LOGIN
          </div>
          <LangSwitch />
        </div>

        <div className="w-full max-w-[440px] enterprise-card p-11 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dark">
              MEMBER PORTAL
            </div>
            <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-mute">
              v3.0.0 · 2026
            </div>
          </div>

          <h2 className="font-display text-[32px] font-medium leading-tight mt-3 mb-2">
            {t('login.welcome')}
          </h2>
          <p className="text-mute text-[14px] mb-8">{t('login.desc')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label={t('login.user')} icon={<User className="w-4 h-4" />}>
              <Input hasIcon placeholder={t('login.userPh')} {...register('username')} />
              {errors.username && <span className="text-xs text-rust">{errors.username.message}</span>}
            </Field>
            <Field label={t('login.pass')} icon={<Lock className="w-4 h-4" />}>
              <Input hasIcon type="password" placeholder={t('login.passPh')} {...register('password')} />
              {errors.password && <span className="text-xs text-rust">{errors.password.message}</span>}
            </Field>

            <div className="flex items-center justify-between text-xs mt-1">
              <label className="flex items-center gap-2 text-mute cursor-pointer hover:text-ink transition-colors">
                <input type="checkbox" defaultChecked className="accent-rust" />
                {t('login.remember')}
              </label>
              <a href="#" className="text-rust font-semibold hover:text-rust-dark transition-colors">
                {t('login.forgot')}
              </a>
            </div>

            <Button
              variant="gold"
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
              className="w-full justify-center py-3.5 mt-4 text-[14px]"
            >
              {loginMutation.isPending ? 'กำลังเข้าสู่ระบบ...' : t('login.btn')}
            </Button>

            <div className="flex items-center gap-3.5 my-4 text-mute font-mono text-[10px] tracking-[0.2em] uppercase">
              <div className="flex-1 h-px bg-rule"></div>
              <span>{t('login.or')}</span>
              <div className="flex-1 h-px bg-rule"></div>
            </div>

            <button
              type="button"
              className="w-full justify-center inline-flex items-center gap-2 py-3 rounded-lg bg-[#1877f2] text-white text-[13.5px] font-medium hover:bg-[#166fe0] transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {t('login.fb')}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-rule">
            <div className="flex items-center justify-between text-[10.5px] font-mono tracking-[0.12em] uppercase text-mute">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-burgundy" />
                <span>256-BIT SSL</span>
              </div>
              <span className="text-rule-strong">|</span>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-700" />
                <span>ISO 27001</span>
              </div>
              <span className="text-rule-strong">|</span>
              <span>© 2026 S.ARAN</span>
            </div>
          </div>

          <div className="absolute -bottom-3 -right-3 w-8 h-8 opacity-70 text-gold">
            <Diamond className="w-full h-full" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
