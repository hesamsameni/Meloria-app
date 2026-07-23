export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      neutral: 'neutral'
    },
    // Replace the default `animate-pulse` skeleton with a shimmer sweep
    // (see the `.sk-shimmer` keyframes in assets/css/main.css).
    skeleton: {
      // `animate-none` cancels Nuxt UI's default `animate-pulse` (the base is
      // merged, not replaced); the shimmer comes from `.sk-shimmer::after`.
      base: 'sk-shimmer relative overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800 animate-none'
    }
  }
})