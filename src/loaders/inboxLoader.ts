export const inboxLoader = async () => {
  await new Promise(() => {
    setTimeout(() => {
      return [
        {
          title: "message 1 ",
          body: "body 1",
        },
      ];
    });
  });
};
