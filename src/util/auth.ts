import { FirebaseAuth, User } from '@firebase/auth-types';

import { UserCredentials } from '../state';

import { firebase, firebaseNS } from './firebase';

export class AuthData {
    static loadFrom(localStorageKey: string): AuthData {
        const lsString = localStorage[localStorageKey];
        if (!lsString) {
            throw new Error("Missing authentication data.");
        }

        const authData = JSON.parse(lsString);
        if (!authData) {
            throw new Error("Missing authentication data.");
        }

        const { accessToken, expiresAt, refreshToken } = authData;
        return new AuthData(accessToken, expiresAt, refreshToken);
    }

    accessToken: string;
    expiresAt: number;
    refreshToken: string;

    constructor(accessToken: string, expiresAt: number, refreshToken: string) {
        this.accessToken = accessToken;
        this.expiresAt = expiresAt;
        this.refreshToken = refreshToken;
    }

    get isValid(): boolean {
        return !!this.accessToken && this.expiresAt > (Date.now() + 10000);
    }

    remove(localStorageKey: string) {
        localStorage[localStorageKey] = undefined;
    }

    saveTo(localStorageKey: string): void {
        localStorage[localStorageKey] = JSON.stringify({
            accessToken: this.accessToken,
            expiresAt: this.expiresAt,
            refreshToken: this.refreshToken,
        });
    }
}

export function getProvider(prov: Exclude<keyof UserCredentials, 'spotify' | 'firebase'>) {
    const auth = firebaseNS.auth!;
    switch (prov) {
        case 'facebook':
            return new auth.FacebookAuthProvider();
        case 'github':
            return new auth.GithubAuthProvider();
        case 'google':
            return new auth.GoogleAuthProvider();
        case 'twitter':
            return new auth.TwitterAuthProvider();
    }
}

export function requireAuth(): Promise<User> {
    const auth = firebase.auth!() as FirebaseAuth;

    if (auth.currentUser) {
        return Promise.resolve(auth.currentUser);
    }

    return new Promise<User>(resolve => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user ? user : auth.signInAnonymously());
        });
    });
}
