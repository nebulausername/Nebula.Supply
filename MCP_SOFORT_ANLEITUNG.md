# 🚀 MCP SOFORT-ANLEITUNG - FUNKTIONIERT JETZT!

## ❌ Das Problem:
Sie haben die Befehle direkt im Terminal eingegeben, aber MCP funktioniert nur über **Cursor/Claude Desktop**!

## ✅ Die Lösung:

### **Schritt 1: Cursor/Claude Desktop NEU STARTEN**
1. **Schließen Sie Cursor/Claude Desktop komplett**
2. **Starten Sie es neu**
3. Die MCP-Server werden automatisch verbunden

### **Schritt 2: MCP-Server im Hintergrund laufen lassen**
```bash
# In einem separaten Terminal (lassen Sie es laufen!)
cd C:\Users\issab\Desktop\TETETTE\mcp
node servers/nebula-eyes-simple.js
```

### **Schritt 3: In Cursor/Claude Desktop testen**
**NICHT im Terminal, sondern in Cursor/Claude Desktop eingeben:**

#### 📁 **Dateisystem-Test:**
```
"Lese die Datei apps/web/src/App.tsx"
```

#### 👁️ **GUI-Automatisierung-Test:**
```
"Mache einen Screenshot des Bildschirms"
```

#### 🔧 **Git-Test:**
```
"Zeige mir den Git-Status"
```

#### 🚀 **Build-Test:**
```
"Führe pnpm build aus"
```

---

## 🔧 FALLS ES IMMER NOCH NICHT FUNKTIONIERT:

### Problem: MCP-Server werden nicht erkannt
**Lösung:**
1. Überprüfen Sie die Konfigurationsdatei:
   - `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json`
2. Überprüfen Sie, ob die Pfade korrekt sind
3. Starten Sie Cursor/Claude Desktop neu

### Problem: "Command not found" Fehler
**Lösung:**
```bash
cd C:\Users\issab\Desktop\TETETTE\mcp
npm install
node servers/nebula-eyes-simple.js
```

### Problem: Screenshots funktionieren nicht
**Lösung:**
```bash
mkdir C:\Users\issab\Desktop\TETETTE\screenshots
```

---

## 🎯 WICHTIGER HINWEIS:

**MCP funktioniert NUR über Cursor/Claude Desktop, NICHT über das Terminal!**

- ✅ **Richtig:** Befehle in Cursor/Claude Desktop eingeben
- ❌ **Falsch:** Befehle direkt im Terminal eingeben

---

## 🚀 NÄCHSTE SCHRITTE:

1. **Starten Sie Cursor/Claude Desktop neu**
2. **Lassen Sie den MCP-Server im Hintergrund laufen**
3. **Testen Sie die Befehle in Cursor/Claude Desktop**

**Ihr AI-Agent hat jetzt "Augen" und kann das gesamte Projekt verwalten!** 🎉

