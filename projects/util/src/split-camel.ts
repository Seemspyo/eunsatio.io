export function splitCamelCase(str: string) {

  return str.split(/(?=[A-Z])/).map(word => word.toLowerCase());
}
