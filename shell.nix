let
  pkgs = import (builtins.fetchTarball {
    # nixos-25.11 @ 2026-03-13
    url = "https://github.com/NixOS/nixpkgs/archive/0590cd39f728e129122770c029970378a79d076a.tar.gz";
    sha256 = "1ia5kjykm9xmrpwbzhbaf4cpwi3yaxr7shl6amj8dajvgbyh2yh4";
  }) { };

  check = pkgs.writeShellApplication {
    name = "check";
    text = ''
      npm ci --silent
      npm run check
      npm run format:check
      npm run lint
    '';
  };

  fix = pkgs.writeShellApplication {
    name = "fix";
    text = ''
      npm ci --silent
      npm run format
      npm run lint:fix || true
    '';
  };

  test = pkgs.writeShellApplication {
    name = "test";
    text = ''
      npm ci --silent
      npm run test
    '';
  };

  build = pkgs.writeShellApplication {
    name = "build";
    text = ''
      npm ci --silent
      npm run build
    '';
  };
in
pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_24
    pkgs.chromium
    check
    fix
    test
    build
  ];

  shellHook = ''
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
  '';
}
