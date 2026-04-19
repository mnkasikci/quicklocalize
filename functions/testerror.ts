export const onRequest = [
  () => {
    setTimeout(() => {
      throw new Error('Custom error');
    });
    return new Response('Error triggered', { status: 200 });
  },
];
