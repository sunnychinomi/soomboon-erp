import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Eye, EyeOff, Shield, Check, Expand } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { LangSwitch } from '@/components/ui/LangSwitch';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data);
      toast.success(`ยินดีต้อนรับ ${data.user.fullName || data.user.username}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
      toast.error(message);
    },
  });

  const onSubmit = (data: LoginForm) => loginMutation.mutate(data);

  return (
    <div className="min-h-screen grid place-items-center p-4 lg:p-10 bg-gradient-to-br from-paper-2 via-paper to-paper-3 relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-rust/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo/5 blur-3xl" />
      </div>

      {/* Outer device frame */}
      <div className="relative w-full max-w-[1280px] z-10">
        <div className="relative rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(25,42,81,0.3)] bg-white ring-1 ring-ink/10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] min-h-[640px]">

            {/* ═══════════════════════════════════════════════════════ */}
            {/* LEFT — Hero with auto parts image                        */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="relative bg-indigo overflow-hidden order-2 lg:order-1 min-h-[300px]">
              {/* Image background */}
              {!imageError ? (
                <img
                  src="/auto-parts.jpg"
                  alt=""
                  onError={() => setImageError(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                /* Fallback: animated gradient with parts illustration */
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-dark via-indigo to-indigo-2">
                  <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 800">
                    <g fill="none" stroke="rgba(183,153,13,0.3)" strokeWidth="1.5">
                      <g transform="translate(400,300)">
                        <circle r="120" /><circle r="80" /><circle r="40" />
                        <line x1="-130" y1="0" x2="130" y2="0" /><line x1="0" y1="-130" x2="0" y2="130" />
                      </g>
                      <g transform="translate(150,500)" stroke="rgba(186,63,29,0.3)">
                        <circle r="60" /><circle r="30" />
                      </g>
                      <g transform="translate(650,500)" stroke="rgba(186,63,29,0.3)">
                        <circle r="50" /><circle r="25" />
                      </g>
                    </g>
                  </svg>
                </div>
              )}

              {/* CI color overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo/70 via-indigo/40 to-indigo-dark/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-dark/90 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(183,153,13,0.18),transparent_50%)]" />

              {/* SA Logo overlay — ทับตัวหนังสือ AURORA AUTOMOTIVE บนจานเบรก */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[5]">
                <div className="relative">
                  {/* Glow ทอง */}
                  <div className="absolute inset-0 bg-gold/30 blur-3xl scale-150 rounded-full" />
                  {/* SA Logo */}
                  <div className="relative flex flex-col items-center">
                    <span
                      className="sa-mark drop-shadow-[0_4px_16px_rgba(183,153,13,0.5)]"
                      style={{ fontSize: 72 }}
                    >
                      SA
                    </span>
                    <div
                      className="font-display font-bold text-[9px] tracking-[0.24em] mt-2 whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(180deg, #f0e1a3 0%, #d4b932 50%, #8a7008 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      S.ARAN OIL & AUTOPART
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-10 lg:p-14 h-full flex flex-col text-white">
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-white/70">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-60 animate-pulse-soft" />
                      <span className="relative inline-flex rounded-full w-2 h-2 bg-green-400" />
                    </span>
                    System Operational
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-white/60">
                    <Shield className="w-3 h-3" />
                    Enterprise
                  </div>
                </div>

                {/* Bottom content */}
                <div className="mt-auto">
                  <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.22em] uppercase text-gold-2 mb-4">
                    <span className="w-6 h-px bg-gold-2" />
                    ก่อตั้ง 2528 · อรัญประเทศ
                  </div>

                  <h1 className="font-serif italic text-[44px] lg:text-[52px] leading-[0.95] mb-4 tracking-tight">
                    <span className="font-display font-light not-italic text-white">ระบบจัดการ</span>
                    <br />
                    <em
                      style={{
                        background: 'linear-gradient(180deg, #f0e1a3 0%, #d4b932 50%, #B7990D 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      อะไหล่ยานยนต์
                    </em>
                  </h1>

                  <p className="text-white/75 text-[14px] max-w-md leading-relaxed font-light mb-7">
                    ครอบคลุมทุกการดำเนินงานตั้งแต่คลังสินค้า การจัดซื้อ การขาย ไปจนถึงการชำระเงิน
                  </p>

                  {/* Stats */}
                  <div className="flex gap-8 pt-6 border-t border-white/15">
                    {[
                      { n: '2,874', l: 'สินค้า' },
                      { n: '3', l: 'สาขา' },
                      { n: '14', l: 'พนักงาน' },
                    ].map((s, i) => (
                      <div key={i}>
                        <div className="editorial-num text-[26px] text-white">{s.n}</div>
                        <div className="font-mono text-[10px] text-white/55 tracking-[0.14em] uppercase mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* RIGHT — Login form                                      */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="relative bg-white p-10 lg:p-14 flex flex-col order-1 lg:order-2">
              {/* Top toolbar */}
              <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
                <LangSwitch />
              </div>

              {/* Form container */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full max-w-sm mx-auto">
                  {/* Logo */}
                  <div className="flex justify-center mb-8">
                    <BrandLogo width={220} />
                  </div>

                  <h2 className="font-display text-[28px] font-semibold text-center mb-2 tracking-tight">
                    ยินดีต้อนรับกลับ
                  </h2>
                  <p className="text-mute text-center text-[13.5px] mb-8">
                    กรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {/* Username */}
                    <div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
                        <input
                          {...register('username')}
                          placeholder="ชื่อผู้ใช้หรืออีเมล"
                          autoComplete="username"
                          className={cn(
                            'w-full pl-11 pr-4 py-3.5 bg-paper-2 border rounded-full text-sm placeholder:text-mute',
                            'focus:outline-none focus:bg-white focus:border-rust focus:ring-4 focus:ring-rust/10 transition-all',
                            errors.username ? 'border-rust' : 'border-transparent',
                          )}
                        />
                      </div>
                      {errors.username && (
                        <span className="text-xs text-rust px-4 mt-1.5 block">{errors.username.message}</span>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="รหัสผ่าน"
                          autoComplete="current-password"
                          className={cn(
                            'w-full pl-11 pr-12 py-3.5 bg-paper-2 border rounded-full text-sm placeholder:text-mute',
                            'focus:outline-none focus:bg-white focus:border-rust focus:ring-4 focus:ring-rust/10 transition-all',
                            errors.password ? 'border-rust' : 'border-transparent',
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-xs text-rust px-4 mt-1.5 block">{errors.password.message}</span>
                      )}
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between text-xs px-1 mt-1">
                      <label className="flex items-center gap-2 text-mute cursor-pointer hover:text-ink transition-colors">
                        <input type="checkbox" defaultChecked className="accent-rust" />
                        จดจำการเข้าสู่ระบบ
                      </label>
                      <a href="#" className="text-rust font-semibold hover:text-rust-dark transition-colors">
                        ลืมรหัสผ่าน?
                      </a>
                    </div>

                    {/* Submit button */}
                    <Button
                      variant="gold"
                      type="submit"
                      disabled={isSubmitting || loginMutation.isPending}
                      className="w-full justify-center py-3.5 rounded-full text-[14px] mt-3 shadow-lg shadow-gold/20"
                    >
                      {loginMutation.isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </Button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-2 text-mute text-[10px] tracking-[0.2em] uppercase font-mono">
                      <div className="flex-1 h-px bg-rule" />
                      <span>หรือเข้าสู่ระบบด้วย</span>
                      <div className="flex-1 h-px bg-rule" />
                    </div>

                    {/* Social login icons */}
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        className="w-11 h-11 rounded-full border border-rule grid place-items-center hover:bg-paper hover:border-rust hover:scale-105 transition-all"
                        title="Google"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="w-11 h-11 rounded-full border border-rule grid place-items-center hover:bg-paper hover:border-rust hover:scale-105 transition-all"
                        title="Facebook"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877f2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="w-11 h-11 rounded-full border border-rule grid place-items-center hover:bg-paper hover:border-rust hover:scale-105 transition-all"
                        title="Apple"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                      </button>
                    </div>

                    {/* Sign up link */}
                    <div className="text-center text-[13px] text-mute mt-6">
                      ยังไม่มีบัญชี?{' '}
                      <a href="#" className="text-rust font-semibold hover:text-rust-dark transition-colors">
                        ติดต่อผู้ดูแลระบบ
                      </a>
                    </div>
                  </form>
                </div>
              </div>

              {/* Bottom trust badges */}
              <div className="flex items-center justify-center gap-4 mt-8 pt-5 border-t border-rule">
                <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.12em] uppercase text-mute">
                  <Shield className="w-3 h-3 text-burgundy" /> 256-bit SSL
                </div>
                <span className="text-rule-strong">·</span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.12em] uppercase text-mute">
                  <Check className="w-3 h-3 text-green-700" /> ISO 27001
                </div>
                <span className="text-rule-strong">·</span>
                <div className="text-[10px] font-mono tracking-[0.12em] uppercase text-mute">
                  v3.0
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-right expand icon (Messimo touch) */}
          <button className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur grid place-items-center text-ink/60 hover:text-ink shadow-md transition-all hover:scale-110 z-20">
            <Expand className="w-3.5 h-3.5" />
          </button>

          {/* Top-left expand icon */}
          <button className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur grid place-items-center text-ink/60 hover:text-ink shadow-md transition-all hover:scale-110 z-20 lg:hidden">
            <Expand className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Decorative copyright */}
        <div className="text-center mt-6 text-xs font-mono tracking-[0.12em] uppercase text-mute">
          © 2026 S.ARAN OIL & AUTOPART CO., LTD. · ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}
