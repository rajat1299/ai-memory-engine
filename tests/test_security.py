from app.security import hash_api_key


def test_hash_api_key_is_deterministic():
    key = "secret-key"
    assert hash_api_key(key) == hash_api_key(key)
