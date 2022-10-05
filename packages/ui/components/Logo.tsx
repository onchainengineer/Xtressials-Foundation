import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { LogoProps } from '@dao-dao/tstypes/ui/Logo'
export * from '@dao-dao/tstypes/ui/Logo'

export const Logo = ({ size = 28, invert, className }: LogoProps) => {
  const { t } = useTranslation()
}

export interface LogoFromImageProps extends LogoProps {
  src: string
  rounded?: boolean
}

export const LogoFromImage = ({
  size = 28,
  className,
  src,
  rounded = false,
}: LogoFromImageProps) => {
  const { t } = useTranslation()

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={t('info.logo')}
      className={clsx(
        {
          'overflow-hidden rounded-full': rounded,
        },
        className
      )}
      height={size}
      src={src}
      width={size}
    />
  )
}
