# Golden Hills Resort ERP — agent rules

This repository is the Golden Hills Resort ERP (QuantumCLK Technologies).

At the START OF EVERY SESSION, before doing anything else, load the `erp-prp` skill with the skill tool and follow it for the whole session. It defines: the only allowed resource folder (/run/media/ash_63/DATA/Intership wrok/ERP_Resouce, read-only), the phase-by-phase flow, record keeping, documentation, the "continue to next phase?" gate, and the rule that you must ask before every commit.
If the skill cannot be loaded, stop and tell the user.
