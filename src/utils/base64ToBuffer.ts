export function base64ToBuffer(base64: string): Buffer {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('base64ToBuffer: A entrada é inválida ou indefinida.');
  }

  const parts = base64.split(',');
  const base64Data = parts.length > 1 ? parts[1] : parts[0];

  try {
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    throw new Error('base64ToBuffer: Erro ao converter Base64 para Buffer.');
  }
}
export function cleanBase64(base64String: string) {
  return base64String.replace(/^data:image\/\w+;base64,/, '');
}
