export interface Args {
  input: string;
  output: string;
  temp: string;
  clean: boolean;
  "jpg-quality": number;
  jpgQuality: number;
  "png-quality": number[] | (string | number)[];
  pngQuality: number[] | (string | number)[];
  _: (string | number)[];
  $0: string;
}
