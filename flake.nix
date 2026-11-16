{
  description = "Canvas Commons development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    # Nixpkgs 26.11 dropped support for Intel macOS.
    nixpkgs-intel-darwin.url = "github:nixos/nixpkgs/nixpkgs-26.05-darwin";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      nixpkgs,
      nixpkgs-intel-darwin,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachSystem
      [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ]
      (
        system:
        let
          pkgs = import (if system == "x86_64-darwin" then nixpkgs-intel-darwin else nixpkgs) {
            inherit system;
          };
          packageJson = builtins.fromJSON (builtins.readFile ./package.json);
          pnpm = pkgs.pnpm_11.override {
            version = pkgs.lib.removePrefix "pnpm@" packageJson.packageManager;
            hash = "sha512-TECX4d0tQjcsTn+lp5H/KPx1pITHrBkuZLHfD97xdZS6mC+bT+2a37PHV4RvVlt5mydj+zcz0d4by4LPRmhJEg==";
            nodejs-slim = pkgs.nodejs-slim_22;
          };
          demo = pkgs.stdenvNoCC.mkDerivation {
            name = "canvas-commons-demo";
            src = ./.;
            nativeBuildInputs = [
              pkgs.nodejs_22
              pnpm
              pkgs.pnpmConfigHook
            ];
            pnpmDeps = pkgs.fetchPnpmDeps {
              pname = "canvas-commons-demo";
              src = ./.;
              inherit pnpm;
              fetcherVersion = 5;
              hash = "sha256-EeMtDf4vOewnn68OKKM91ls+3gvY5Xgs5VF4IXE1pHU=";
            };
            # Nix source snapshots do not include Git author metadata.
            postPatch = ''
              substituteInPlace packages/docs/docusaurus.config.js \
                --replace-fail 'showLastUpdateAuthor: true' 'showLastUpdateAuthor: false'
            '';
            buildPhase = ''
              runHook preBuild
              pnpm run build
              pnpm run examples:build
              pnpm run editor:showcase
              pnpm run docs:build
              runHook postBuild
            '';
            installPhase = ''
              runHook preInstall
              mkdir -p "$out"
              cp -r packages/docs/build/. "$out/"
              runHook postInstall
            '';
            dontFixup = true;
          };
          demoServer = pkgs.writeShellApplication {
            name = "canvas-commons-demo";
            runtimeInputs = [ pkgs.http-server ];
            text = ''
              exec http-server ${demo} -a 127.0.0.1 -p "''${1:-8000}" --cors -c-1
            '';
          };
        in
        {
          devShells.default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_22
              pkgs.corepack
              pkgs.prettier
            ];
            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
            '';
          };
          packages.doc = demo;
          packages.default = demo;
          apps.doc = flake-utils.lib.mkApp { drv = demoServer; };
          apps.default = flake-utils.lib.mkApp { drv = demoServer; };
        }
      );
}
