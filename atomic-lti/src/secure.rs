use crate::errors::SecureError;
use openssl::rsa::Rsa;
use openssl::symm::Cipher;
use rand::Rng;

pub fn generate_secure_string(len: usize) -> String {
  rand::rng()
    .sample_iter(rand::distr::Alphanumeric)
    .take(len)
    .map(char::from)
    .collect()
}

pub fn decrypt_rsa_private_key(
  key: &str,
  passphrase: &str,
) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
  let decrypted = Rsa::private_key_from_pem_passphrase(key.as_bytes(), passphrase.as_bytes())
    .map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

  Ok(decrypted)
}

/// Generate a new RSA key pair and return the private key as a PEM string.
/// The password is used to encrypt the private key and is required to decrypt it.
pub fn generate_rsa_key_pair(
  passphrase: &str,
) -> Result<(Rsa<openssl::pkey::Private>, String), SecureError> {
  let rsa_key_pair: Rsa<openssl::pkey::Private> =
    Rsa::generate(2048).map_err(|e| SecureError::PrivateKeyGenerateFailed(e.to_string()))?;

  let cipher = Cipher::aes_256_cbc();

  let pem = rsa_key_pair
    .private_key_to_pem_passphrase(cipher, passphrase.as_bytes())
    .map_err(|e| SecureError::PrivateKeyGenerateFailed(e.to_string()))?;

  let pem_string =
    String::from_utf8(pem).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

  Ok((rsa_key_pair, pem_string))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_generate_secure_string() {
    let len = 10;
    let secure_string = generate_secure_string(len);
    assert_eq!(secure_string.len(), len);
  }

  #[test]
  fn test_generate_rsa_key_pair() {
    let passphrase = "asdfasdf";
    let (rsa_key_pair, pem_string) =
      generate_rsa_key_pair(passphrase).expect("Failed to generate RSA key pair");
    let modulus = rsa_key_pair.n().to_owned().expect("Failed to get modulus");
    let bit_size = modulus.num_bits();
    assert_eq!(bit_size, 2048, "The key size should be 2048 bits");
    assert!(pem_string.contains("BEGIN RSA PRIVATE KEY"));
    assert!(pem_string.contains("END RSA PRIVATE KEY"));
  }
}
