import { atom } from 'recoil';

export const selectedAssetCaptionState = atom<string>({
    key: 'selectedAssetCaptionState',
    default: '',
});
