import { UK } from '../../i18n/uk.js'
import { confirmDialog } from './ConfirmDialog.js'
import type { UiKit } from '../UiKit.js'

export const offerHint = async (kit: UiKit): Promise<boolean> => {
  const { adHints, ads, wallet, analytics } = kit.services
  const left = adHints.remaining
  if (left <= 0) {
    await confirmDialog(kit, { title: UK.game.noHints, text: UK.hintOffer.none, confirm: UK.common.ok, cancel: UK.common.close, icon: 'bulb' })
    return false
  }
  const agreed = await confirmDialog(kit, {
    title: UK.hintOffer.title,
    text: UK.hintOffer.text(left),
    confirm: UK.hintOffer.watch,
    cancel: UK.common.close,
    icon: 'bulb',
    confirmIcon: 'video',
  })
  if (!agreed) return false
  analytics.track('rewarded_ad_offered', { placement: 'hint' })
  const granted = await ads.rewarded()
  if (!granted || !adHints.consume()) return false
  analytics.track('rewarded_ad_watched', { placement: 'hint' })
  wallet.addHints(1)
  kit.feedback('coin', 'success')
  kit.toast.show(UK.result.bonusHint, 'success')
  return true
}
