export class GetIconDTO {
  url: string;
  size: number;
  options: { https?: boolean } = { https: true };
}
