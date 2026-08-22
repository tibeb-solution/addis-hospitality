import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  variant?: 'header' | 'auth' | 'hero'
  className?: string
}

const variantClasses = {
  header: 'h-10 w-auto rounded-md shadow-sm sm:h-11',
  auth: 'mx-auto h-auto w-full max-w-[280px] rounded-xl shadow-lg',
  hero: 'mx-auto h-auto w-full max-w-[460px] rounded-2xl shadow-2xl',
}

export function BrandLogo({ variant = 'header', className }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Addis Hospitality Service"
      width={720}
      height={383}
      priority={variant === 'hero' || variant === 'auth'}
      className={cn(variantClasses[variant], className)}
    />
  )
}
