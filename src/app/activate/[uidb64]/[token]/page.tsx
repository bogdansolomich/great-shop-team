'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useActivateUserPatchMutation } from '@/store/endpoints/authEndpoints';

export default function ActivatePage() {
  const router = useRouter();
  const params = useParams();
  const uidb64 = params?.uidb64;
  const token = params?.token;
  const [activateUser, { isLoading, isSuccess, isError }] = useActivateUserPatchMutation();

  useEffect(() => {
    if (uidb64 && token) {
      void activateUser({ uidb64: String(uidb64), token: String(token) });
    }
  }, [uidb64, token, activateUser]);

  useEffect(() => {
    if (isSuccess) {
      const timer = window.setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isSuccess, router]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            🔐
          </div>

          {isLoading && (
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Activating your account...</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The page is sending a request to the server. Please wait.
              </p>
            </div>
          )}

          {isSuccess && (
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Success!</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your account has been activated. You will be redirected to the login page.
              </p>
            </div>
          )}

          {isError && (
            <div>
              <h1 className="text-2xl font-semibold text-red-600">Activation error</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The link is expired or invalid. Please try registering again.
              </p>
            </div>
          )}

          {!isLoading && !isSuccess && !isError && (
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Preparing for activation...</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                We check the link and send a request to the server.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
