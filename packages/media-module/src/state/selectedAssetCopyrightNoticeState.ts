import { atom } from 'recoil';

export const selectedAssetCopyrightNoticeState = atom<string>({
    key: 'selectedAssetCopyrightNoticeState',
    default: '',
});
