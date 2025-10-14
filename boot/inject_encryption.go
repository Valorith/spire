package boot

import (
	"github.com/EQEmuTools/spire/internal/encryption"
	"github.com/google/wire"
)

var encryptionSet = wire.NewSet(
	encryption.NewEncrypter,
)
