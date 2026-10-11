#!/usr/bin/env bash
set +H   # matikan history expansion: aman meski dijalankan dalam mode interaktif (klik dua kali)
# ==========================================
# DIAGNOSIS KONEKSI GIT KE GITHUB
# Jalankan di dalam folder repository. Memeriksa berurutan:
#   1. Prasyarat    : Git, folder repo, remote
#   2. URL remote   : format, protokol, token yang tertanam di URL
#   3. Jaringan     : internet, DNS, proxy, sertifikat, SSH
#   4. Akses baca   : git ls-remote
#   5. Akun GitHub  : login gh, keberadaan repo, izin tulis
#   6. Kredensial   : akun yang dipakai Git, credential helper
#   7. Akses tulis  : git push --dry-run (tidak mengirim apa pun)
# Lalu menawarkan perbaikan yang relevan. Tidak ada yang diubah tanpa konfirmasi.
#
# Variabel opsional: REMOTE (default origin), NET_TIMEOUT (detik, default 20)
# Simpan dengan akhir baris LF.
# ==========================================
set -uo pipefail   # tanpa -e: diagnosis tetap lanjut walau satu pemeriksaan gagal

REMOTE="${REMOTE:-origin}"
NET_TIMEOUT="${NET_TIMEOUT:-20}"
PASS=0 WARN=0 FAIL=0
FIXES=()                     # kode perbaikan yang disarankan (unik)
OWNER="" REPO="" PROTO="" URL="" cred="" CRED_CHECKED=0

# ---------- Tampilan ----------
section() { echo; echo "== $* =="; }
ok()   { echo "  [OK]         $*"; PASS=$((PASS + 1)); }
info() { echo "  [INFO]       $*"; }
warn() { echo "  [PERINGATAN] $*"; WARN=$((WARN + 1)); }
fail() { echo "  [GAGAL]      $*"; FAIL=$((FAIL + 1)); }
hint() { echo "               -> $*"; }
mask_url() { sed -E 's#(https?://)[^/@]+@#\1****@#'; }

suggest() {
  local f
  for f in "${FIXES[@]}"; do [[ "$f" == "$1" ]] && return 0; done
  FIXES+=("$1")
}

on_exit() {
  if [[ -t 0 ]]; then
    echo
    read -r -p "Tekan Enter untuk menutup..." _ || true
  fi
}
trap on_exit EXIT

TIMEOUT_CMD=()
command -v timeout >/dev/null 2>&1 && TIMEOUT_CMD=(timeout "$NET_TIMEOUT")

# Perintah git ke jaringan tanpa jendela/prompt login, agar tidak menggantung.
git_net() {
  GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10" \
    "${TIMEOUT_CMD[@]}" git "$@"
}

have_gh() { command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; }

# Menerjemahkan pesan error git menjadi penyebab + saran. $1 = keluaran, $2 = kode keluar.
explain_git_error() {
  local out="$1" rc="$2"
  if [[ "$rc" == "124" ]]; then
    fail "Waktu habis (${NET_TIMEOUT} detik) saat menghubungi GitHub."
    hint "Jaringan lambat atau diblokir firewall/proxy. Coba jaringan lain atau atur proxy."
  elif grep -qiE "could not resolve host" <<< "$out"; then
    fail "Nama github.com tidak bisa di-resolve (DNS)."
    hint "Periksa koneksi internet atau DNS. Coba buka https://github.com di browser."
  elif grep -qiE "failed to connect|connection (timed out|refused|reset)|operation timed out" <<< "$out"; then
    fail "Tidak bisa tersambung ke GitHub."
    hint "Koneksi diblokir firewall/proxy kantor, atau internet terputus."
  elif grep -qiE "proxy|connect tunnel failed" <<< "$out"; then
    fail "Proxy jaringan menolak atau menghalangi koneksi ke GitHub."
    hint "Umum di jaringan kantor/kampus. Cek: git config --global --get http.proxy dan variabel HTTPS_PROXY."
    hint "Minta alamat proxy yang benar ke admin jaringan, atau coba jaringan lain (mis. hotspot)."
  elif grep -qiE "ssl certificate|certificate problem|schannel|unable to get local issuer" <<< "$out"; then
    fail "Masalah sertifikat SSL (biasa terjadi di jaringan kantor/antivirus)."
    suggest ssl_schannel
  elif grep -qiE "permission denied \(publickey\)" <<< "$out"; then
    fail "Kunci SSH ditolak GitHub."
    hint "Pakai URL HTTPS (lebih mudah dengan gh), atau daftarkan kunci SSH di GitHub."
    suggest url_https
  elif grep -qiE "permission to .* denied|the requested url returned error: 403" <<< "$out"; then
    fail "Akun yang dipakai Git tidak punya izin ke repo ini (403)."
    if (( CRED_CHECKED == 1 )) && [[ -z "$cred" ]]; then
      hint "Git belum punya kredensial GitHub tersimpan; hubungkan dengan login gh."
      suggest setup_git
    else
      hint "Biasanya kredensial akun LAIN masih tersimpan di Windows."
      suggest reject_cred; suggest setup_git
    fi
  elif grep -qiE "authentication failed|invalid username or password|returned error: 401" <<< "$out"; then
    fail "Autentikasi gagal: token/kata sandi tersimpan salah atau kedaluwarsa."
    suggest reject_cred; suggest setup_git
  elif grep -qiE "could not read username|terminal prompts disabled" <<< "$out"; then
    fail "GitHub meminta login, tetapi Git tidak punya kredensial tersimpan."
    hint "Bisa juga berarti repo TIDAK ADA atau PRIVAT: GitHub menjawab keduanya dengan permintaan login."
    suggest setup_git
  elif grep -qiE "repository not found|not found" <<< "$out"; then
    fail "Repository tidak ditemukan."
    hint "Periksa ejaan owner/nama repo di URL, atau akun tidak punya akses ke repo privat ini."
  elif grep -qiE "does not appear to be a git repository" <<< "$out"; then
    fail "URL remote bukan repository Git yang valid."
  else
    fail "Gagal (kode $rc). Pesan dari Git:"
    sed 's/^/               | /' <<< "$out" | mask_url | head -n 6
  fi
}

# ==========================================
# 1. PRASYARAT
# ==========================================
section "1. Prasyarat"
if ! command -v git >/dev/null 2>&1; then
  fail "Git tidak terpasang. Unduh: https://git-scm.com/download/win"
  exit 1
fi
ok "$(git --version)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "Folder ini bukan repository Git: $PWD"
  hint "Jalankan skrip ini di dalam folder proyek (yang berisi folder .git)."
  exit 1
fi
cd "$(git rev-parse --show-toplevel)" || exit 1
ok "Repository: $(basename "$PWD")  (branch: $(git symbolic-ref --quiet --short HEAD || echo detached))"

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  fail "Remote '$REMOTE' belum ada."
  hint "Tambahkan: git remote add $REMOTE https://github.com/<akun>/<repo>.git"
  exit 1
fi
ok "Remote '$REMOTE' ada."

# ==========================================
# 2. URL REMOTE
# ==========================================
section "2. URL remote"
URL="$(git remote get-url "$REMOTE")"
raw_url="$(git config --get "remote.$REMOTE.url")"
push_url="$(git remote get-url --push "$REMOTE")"
info "URL: $(mask_url <<< "$URL")"

if [[ "$URL" =~ ^https?://[^/@]+:[^/@]+@ ]]; then
  fail "URL berisi username:token/kata sandi secara terang."
  hint "Token ini tersimpan polos di .git/config dan bisa bocor. Cabut token itu di GitHub."
  suggest url_https
elif [[ "$URL" =~ ^https?://[^/@]+@ ]]; then
  warn "URL berisi nama pengguna sebelum host; biasanya tidak perlu."
  suggest url_https
fi

case "$URL" in
  https://*)               PROTO="https"; ok "Protokol HTTPS." ;;
  git@*|ssh://*)           PROTO="ssh";   ok "Protokol SSH." ;;
  http://*)                PROTO="http";  warn "Protokol HTTP tanpa enkripsi; gunakan HTTPS."; suggest url_https ;;
  *)                       PROTO="lain";  warn "Protokol tidak umum: ${URL%%:*}" ;;
esac

if [[ "$URL" =~ github\.com[:/]+([^/]+)/([^/]+)$ ]]; then
  OWNER="${BASH_REMATCH[1]}"; REPO="${BASH_REMATCH[2]%.git}"; REPO="${REPO%/}"
  ok "Pemilik: $OWNER   Repo: $REPO"
else
  fail "Format URL bukan github.com/<akun>/<repo>."
  hint "Contoh benar: https://github.com/wahyuajismustofa30/dekeku.git"
fi

[[ "$push_url" != "$URL" ]] && warn "URL untuk push berbeda: $(mask_url <<< "$push_url")"
[[ -n "$raw_url" && "$raw_url" != "$URL" ]] && info "URL diubah oleh aturan url.insteadOf di konfigurasi Git (asli: $(mask_url <<< "$raw_url"))."

# ==========================================
# 3. JARINGAN
# ==========================================
section "3. Jaringan"
proxy="$(git config --get https.proxy || git config --get http.proxy || true)"
env_proxy="${HTTPS_PROXY:-${https_proxy:-}}"
[[ -n "$proxy" ]] && info "Git memakai proxy: $(mask_url <<< "$proxy")"
[[ -n "$env_proxy" ]] && info "Variabel HTTPS_PROXY aktif: $(mask_url <<< "$env_proxy")"

if command -v curl >/dev/null 2>&1; then
  err_file="$(mktemp)"
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 https://github.com 2>"$err_file")"
  curl_err="$(cat "$err_file")"; rm -f "$err_file"
  if [[ "$code" != "000" ]]; then
    ok "github.com dapat dijangkau lewat HTTPS (HTTP $code)."
  elif grep -qi "resolve" <<< "$curl_err"; then
    fail "DNS gagal: github.com tidak dikenali. Periksa koneksi internet."
  elif grep -qiE "ssl|certificate" <<< "$curl_err"; then
    fail "Sertifikat SSL bermasalah saat menghubungi github.com."
    suggest ssl_schannel
  else
    fail "github.com tidak dapat dijangkau: ${curl_err:-tanpa pesan}"
    hint "Periksa internet, firewall, atau proxy."
  fi
else
  info "curl tidak tersedia; pemeriksaan jaringan langsung dilewati."
fi

if [[ "$PROTO" == "ssh" ]]; then
  ssh_out="$("${TIMEOUT_CMD[@]}" ssh -T -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new git@github.com 2>&1)"
  if grep -qi "successfully authenticated" <<< "$ssh_out"; then
    ok "SSH tersambung: $(grep -o 'Hi [^ ]*' <<< "$ssh_out" | head -n1)"
  elif grep -qi "permission denied (publickey)" <<< "$ssh_out"; then
    fail "SSH tersambung, tetapi kunci SSH tidak dikenali GitHub."
    suggest url_https
  elif grep -qiE "timed out|refused|port 22" <<< "$ssh_out"; then
    fail "Port SSH (22) diblokir jaringan ini."
    suggest ssh_443
  else
    warn "Hasil uji SSH tidak dikenali: $(head -n1 <<< "$ssh_out")"
  fi
fi

# ==========================================
# 4. AKSES BACA
# ==========================================
section "4. Akses baca (git ls-remote)"
read_out="$(git_net ls-remote --heads "$REMOTE" 2>&1)"; read_rc=$?
if (( read_rc == 0 )); then
  branches="$(grep -c 'refs/heads/' <<< "$read_out" || true)"
  if (( branches == 0 )); then
    ok "Repo dapat dibaca; repo masih kosong (belum ada branch)."
  else
    ok "Repo dapat dibaca; $branches branch: $(sed -n 's#.*refs/heads/##p' <<< "$read_out" | paste -sd ' ' -)"
    grep -q 'refs/heads/main$' <<< "$read_out" || warn "Tidak ada branch 'main' di GitHub."
  fi
else
  explain_git_error "$read_out" "$read_rc"
fi

# ==========================================
# 5. AKUN GITHUB (gh)
# ==========================================
section "5. Akun GitHub (gh)"
GH_USER=""
if ! command -v gh >/dev/null 2>&1; then
  info "GitHub CLI (gh) tidak terpasang; pemeriksaan akun dilewati."
elif ! have_gh; then
  warn "gh terpasang tetapi belum login."
  suggest gh_login
else
  GH_USER="$(gh api user --jq .login 2>/dev/null | tr -d '\r')"
  ok "Login gh sebagai: $GH_USER"
  if [[ -n "$OWNER" && -n "$REPO" ]]; then
    meta="$(gh api "repos/$OWNER/$REPO" --jq '[.private, .permissions.push, .default_branch] | @tsv' 2>&1 | tr -d '\r')"
    if grep -qiE "not found|404" <<< "$meta"; then
      fail "Repo $OWNER/$REPO tidak ditemukan untuk akun $GH_USER."
      hint "Repo tidak ada (salah ejaan / sudah dihapus / diganti nama), atau privat dan $GH_USER bukan kolaborator."
    elif IFS=$'\t' read -r is_private can_push def_branch <<< "$meta" && [[ "$can_push" =~ ^(true|false)$ ]]; then
      ok "Repo ditemukan ($( [[ "$is_private" == "true" ]] && echo privat || echo publik ), branch default: $def_branch)."
      if [[ "$can_push" == "true" ]]; then
        ok "Akun $GH_USER punya izin tulis (push)."
      else
        fail "Akun $GH_USER TIDAK punya izin tulis ke repo ini."
        hint "Minta pemilik repo menambahkan $GH_USER sebagai kolaborator, atau login dengan akun pemilik."
      fi
    else
      warn "Info repo tidak dapat dibaca: $(head -n1 <<< "$meta")"
    fi
  fi
fi

# ==========================================
# 6. KREDENSIAL GIT (HTTPS)
# ==========================================
if [[ "$PROTO" == "https" ]]; then
  section "6. Kredensial Git"
  helpers="$( { git config --get-all credential.https://github.com.helper; git config --get-all credential.helper; } 2>/dev/null | grep -v '^$' || true)"
  if grep -q "auth git-credential" <<< "$helpers"; then
    ok "Git memakai login GitHub CLI (gh) untuk github.com."
  elif grep -qi "manager" <<< "$helpers"; then
    info "Git memakai Git Credential Manager (Windows)."
    have_gh && hint "Bisa disamakan dengan login gh agar akunnya pasti sama."
    have_gh && suggest setup_git
  elif [[ -z "$helpers" ]]; then
    warn "Tidak ada credential helper; Git akan meminta login setiap kali."
    suggest setup_git
  else
    info "Credential helper: $(paste -sd ' ' - <<< "$helpers")"
  fi

  # Akun yang benar-benar akan dipakai Git (kata sandi/token TIDAK ditampilkan).
  cred="$(printf 'protocol=https\nhost=github.com\n\n' \
    | GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never "${TIMEOUT_CMD[@]}" git credential fill 2>/dev/null || true)"
  CRED_CHECKED=1
  cred_user="$(sed -n 's/^username=//p' <<< "$cred" | tr -d '\r')"
  if [[ -z "$cred" ]]; then
    warn "Belum ada kredensial GitHub tersimpan untuk Git."
    suggest setup_git
  else
    ok "Git akan login sebagai: ${cred_user:-(tanpa nama)}"
    if [[ -n "$GH_USER" && -n "$cred_user" && "${cred_user,,}" != "${GH_USER,,}" && "$cred_user" != "x-access-token" ]]; then
      warn "Akun Git ($cred_user) berbeda dengan akun gh ($GH_USER)."
      hint "Push memakai akun Git. Bila akun itu tidak punya izin, push ditolak (403)."
      suggest reject_cred; suggest setup_git
    fi
  fi
fi

# ==========================================
# 7. AKSES TULIS
# ==========================================
section "7. Akses tulis (push --dry-run, tidak mengirim apa pun)"
branch="$(git symbolic-ref --quiet --short HEAD || true)"
if (( read_rc != 0 )); then
  info "Dilewati karena akses baca belum berhasil."
elif ! git rev-parse --verify --quiet HEAD >/dev/null; then
  info "Dilewati: belum ada commit di lokal."
elif [[ -z "$branch" ]]; then
  info "Dilewati: HEAD dalam kondisi detached."
else
  push_out="$(git_net push --dry-run "$REMOTE" "HEAD:refs/heads/$branch" 2>&1)"; push_rc=$?
  if (( push_rc == 0 )); then
    ok "Izin tulis ke '$branch' terkonfirmasi."
  elif grep -qiE "rejected|non-fast-forward|fetch first" <<< "$push_out"; then
    ok "Izin tulis terkonfirmasi."
    info "GitHub punya commit yang belum ada di lokal; tarik dulu sebelum push (sync.sh menanganinya)."
  else
    explain_git_error "$push_out" "$push_rc"
  fi
fi

# ==========================================
# RINGKASAN & PERBAIKAN
# ==========================================
section "Ringkasan"
echo "  $PASS OK, $WARN peringatan, $FAIL gagal"
if (( FAIL == 0 && WARN == 0 )); then
  echo "  Koneksi, URL, dan autentikasi ke GitHub semuanya baik."
fi
(( ${#FIXES[@]} == 0 )) && exit 0

https_url="https://github.com/${OWNER}/${REPO}.git"
label() {
  case "$1" in
    setup_git)    echo "Hubungkan Git dengan login gh (gh auth setup-git)" ;;
    gh_login)     echo "Login GitHub CLI lewat browser (gh auth login)" ;;
    reject_cred)  echo "Hapus kredensial GitHub lama yang tersimpan di Windows" ;;
    url_https)    echo "Ganti URL remote menjadi $https_url" ;;
    ssl_schannel) echo "Pakai sertifikat Windows untuk HTTPS (http.sslBackend schannel)" ;;
    ssh_443)      echo "Arahkan SSH ke port 443 (untuk jaringan yang memblokir port 22)" ;;
  esac
}

apply_fix() {
  case "$1" in
    setup_git)
      if ! have_gh; then echo "  gh belum login; jalankan perbaikan 'Login GitHub CLI' dulu."; return 1; fi
      gh auth setup-git --hostname github.com && echo "  [OK] Git sekarang memakai login gh." ;;
    gh_login)
      gh auth login --hostname github.com --web --git-protocol https ;;
    reject_cred)
      printf 'protocol=https\nhost=github.com\n\n' | git credential reject \
        && echo "  [OK] Kredensial lama dihapus. Login berikutnya memakai akun yang benar." ;;
    url_https)
      if [[ -z "$OWNER" || -z "$REPO" ]]; then echo "  Owner/repo tidak terbaca dari URL; ubah manual."; return 1; fi
      git remote set-url "$REMOTE" "$https_url" && echo "  [OK] URL remote: $https_url" ;;
    ssl_schannel)
      git config --global http.sslBackend schannel && echo "  [OK] Git memakai sertifikat Windows." ;;
    ssh_443)
      mkdir -p ~/.ssh
      if grep -q "ssh.github.com" ~/.ssh/config 2>/dev/null; then
        echo "  ~/.ssh/config sudah berisi pengaturan ssh.github.com."
      else
        printf '\nHost github.com\n  Hostname ssh.github.com\n  Port 443\n  User git\n' >> ~/.ssh/config
        echo "  [OK] ~/.ssh/config diperbarui (github.com lewat port 443)."
      fi ;;
  esac
}

while (( ${#FIXES[@]} > 0 )); do
  echo
  echo "Perbaikan yang disarankan:"
  for i in "${!FIXES[@]}"; do
    printf '  %d. %s\n' "$((i + 1))" "$(label "${FIXES[$i]}")"
  done
  echo "  0. Selesai tanpa perbaikan lagi"
  read -r -p "Pilih nomor: " pick || pick=0
  [[ "$pick" =~ ^[0-9]+$ ]] || pick=0
  (( 10#$pick == 0 || 10#$pick > ${#FIXES[@]} )) && break
  idx=$((10#$pick - 1))
  read -r -p "Jalankan '$(label "${FIXES[$idx]}")'? (y/N): " yn || yn=""
  if [[ "${yn,,}" =~ ^(y|ya|yes)$ ]]; then
    apply_fix "${FIXES[$idx]}"
    FIXES=("${FIXES[@]:0:idx}" "${FIXES[@]:idx+1}")
  fi
done
echo
echo "Jalankan ulang skrip ini untuk memastikan semuanya sudah beres."
