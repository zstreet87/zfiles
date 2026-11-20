# mamba shell hook. Prefix is discovered, not hardcoded: MAMBA_ROOT_PREFIX if set, else ~/.miniforge3 or ~/miniforge3.
: "${MAMBA_ROOT_PREFIX:=$([[ -d $HOME/.miniforge3 ]] && echo "$HOME/.miniforge3" || echo "$HOME/miniforge3")}"
export MAMBA_ROOT_PREFIX
export MAMBA_EXE="$MAMBA_ROOT_PREFIX/bin/mamba"
if [[ -x $MAMBA_EXE ]]; then
    if __mamba_setup="$("$MAMBA_EXE" shell hook --shell zsh --root-prefix "$MAMBA_ROOT_PREFIX" 2>/dev/null)"; then
        eval "$__mamba_setup"
    else
        alias mamba="$MAMBA_EXE"  # fallback: no `mamba activate`, but the command works
    fi
    unset __mamba_setup
else
    unset MAMBA_EXE MAMBA_ROOT_PREFIX
fi
