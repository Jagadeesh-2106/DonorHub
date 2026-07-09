#!/bin/bash
# Re-create structure and setup dependencies
npm create vite@latest donorhub --template react-ts
cd donorhub
npm install @supabase/supabase-js react-router-dom react-hook-form zod @hookform/resolvers clsx tailwindcss postcss autoprefixer
npx tailwindcss init -p
