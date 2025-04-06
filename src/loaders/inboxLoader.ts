export const inboxLoader = async () => {
  await new Promise((resolve) => {
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
