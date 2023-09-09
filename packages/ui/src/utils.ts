type Child = {
  name: string;
  path: string;
  children: Child[];
};

export function listToTree(list: Array<string>) {
  const children: Array<Child> = [];
  for (const item of list) {
    let cwd = children;

    const path = item.split('/').slice(1);

    for (const slice of path) {
      const dir = cwd.find((item) => item.name === slice);
      if (dir) {
        cwd = dir.children;
      } else {
        if (!slice.match(/.\.[a-zA-Z0-9]+$/g))
          cwd.push({
            path: `/${path.join('/')}`,
            name: slice,
            children: [],
          });
        break;
      }
    }
  }
  return children;
}
