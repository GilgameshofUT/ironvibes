import { data as ancientWonders } from '@datasworn-community/ancient-wonders';
import { data as feRunners } from '@datasworn-community/fe-runners';
import { data as ironsmith } from '@datasworn-community/ironsmith';
import { data as classicDelve } from '@datasworn-community/ironsworn-classic-delve';
import { data as classic } from '@datasworn-community/ironsworn-classic';
import { data as starforged } from '@datasworn-community/starforged';
import { data as starsmith } from '@datasworn-community/starsmith';
import { data as sunderedIsles } from '@datasworn-community/sundered-isles';
import vaultsAndVows from './vaults_and_vows.json';
import { flattenDataswornPack, type DataswornPack } from './catalog';

export const bundledPacks: DataswornPack[] = [
	classic, classicDelve, starforged, sunderedIsles,
	ancientWonders, feRunners, ironsmith, starsmith, vaultsAndVows
].map((pack) => pack as unknown as DataswornPack);

export const bundledRecords = bundledPacks.flatMap((pack) => flattenDataswornPack(pack));
