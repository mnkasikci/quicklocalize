export const onRequest = [
  (context: any) => {
    setTimeout(() => {
      throw new Error('Custom error');
    });
  },
];