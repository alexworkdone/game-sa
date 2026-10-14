import type { TierHazard } from '../../config/hazards.js'
import { CurrentHazard } from './CurrentHazard.js'
import { IceHazard } from './IceHazard.js'
import type { HazardHost, IHazard } from './IHazard.js'
import { LightningHazard } from './LightningHazard.js'

export const createHazards = (host: HazardHost, tierHazard: TierHazard): IHazard[] => {
  const hazards: IHazard[] = []
  if (tierHazard === 'ice') hazards.push(new IceHazard(host))
  if (tierHazard === 'lightning') hazards.push(new LightningHazard())
  if (tierHazard === 'currents') hazards.push(new CurrentHazard(host))
  return hazards
}
