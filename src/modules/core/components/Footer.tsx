import { LegalFooter, type LegalFooterProps } from '@/modules/legal/components/LegalFooter'

export function Footer({ compact = false }: LegalFooterProps) {
  return <LegalFooter compact={compact} />
}
