import { atom } from 'recoil';

export const selectedAssetLabelState = atom<string>({
    key: 'selectedAssetLabelState',
    default: '',
});
