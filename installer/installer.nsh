!macro customInstall
  DetailPrint "Проверка системных компонентов Microsoft Visual C++ 2015-2022..."
  ClearErrors
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X64" "Installed"
  ${If} ${Errors}
    ClearErrors
    ReadRegDWORD $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\X64" "Installed"
  ${EndIf}

  ${If} $0 != 1
    DetailPrint "Системные компоненты не обнаружены. Установка Microsoft Visual C++ Redistributable (x64)..."
    ${If} ${FileExists} "$INSTDIR\resources\installer\vc_redist.x64.exe"
      ExecWait '"$INSTDIR\resources\installer\vc_redist.x64.exe" /install /quiet /norestart' $1
      DetailPrint "Установка системных библиотек завершена (код: $1)"
    ${EndIf}
  ${Else}
    DetailPrint "Все необходимые компоненты Microsoft Visual C++ уже установлены."
  ${EndIf}

  ; Cleanup installer binary to save disk space for the user
  ${If} ${FileExists} "$INSTDIR\resources\installer\vc_redist.x64.exe"
    Delete "$INSTDIR\resources\installer\vc_redist.x64.exe"
    RMDir "$INSTDIR\resources\installer"
  ${EndIf}
!macroend
