Set WshShell = CreateObject("WScript.Shell")

' Caminho do seu BAT
bat = "C:\projetos\missal-planner\iniciar-missal-planner.bat"

' Executar oculto (0) e sem esperar terminar (False)
WshShell.Run """" & bat & """", 0, False
