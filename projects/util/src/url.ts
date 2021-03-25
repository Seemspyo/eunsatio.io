type SearchLike = string | URLSearchParams | string[][] | Record<string, string>;

export class URLWithSearchParams extends URL {

  constructor(
    path: string,
    search: SearchLike,
    base?: string | URL,
  ) {
    super(path, base);
    this.applySearchParams(search);
  }

  private applySearchParams(search: SearchLike) {
    const params = new URLSearchParams(search);

    for (const [ key, value ] of params) {

      this.searchParams.append(key, value);

    }
  }

}
