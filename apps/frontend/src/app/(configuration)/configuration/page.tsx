'use client';

import React from 'react';

export default function ConfigurationPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">TrueSubmit</h1>
        <p className="text-zinc-400">
          Chào mừng đến với Trình thiết lập hệ thống TrueSubmit. Hãy làm theo các bước hướng dẫn để cấu hình môi trường của bạn.
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <p className="text-sm text-zinc-500">Trình thiết lập đang được phát triển...</p>
        </div>
      </div>
    </div>
  );
}
