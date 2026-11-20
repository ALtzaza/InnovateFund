# InnovateFund — Decentralized Crowdfunding Platform
 
ระบบระดมทุนแบบกระจายศูนย์บน Ethereum (Sepolia Testnet) ที่เก็บเงินไว้ใน Smart Contract และ **ทยอยจ่ายให้เจ้าของโครงการตามความสำเร็จของแต่ละ Milestone** เมื่อผู้สนับสนุนโหวตอนุมัติ
 
> Blockchain Crowdfunding & Milestone Fund Management — โจทย์ที่ 5
 
> ⚠️ โปรเจกต์นี้ใช้งานบน **Sepolia Testnet** เท่านั้น (ใช้ Test ETH ไม่มีมูลค่าจริง)
 
---
 
## สารบัญ
- [ภาพรวม](#ภาพรวม)
- [ฟีเจอร์](#ฟีเจอร์)
- [Tech Stack](#tech-stack)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [Smart Contract](#smart-contract)
- [การติดตั้งและรันเว็บ](#การติดตั้งและรันเว็บ)
- [Deploy Smart Contract ด้วย Remix](#deploy-smart-contract-ด้วย-remix)
- [วิธีทดสอบระบบ](#วิธีทดสอบระบบ)
- [Security](#security)
- [ข้อจำกัดที่ทราบ](#ข้อจำกัดที่ทราบ)
- [ทีมผู้พัฒนา](#ทีมผู้พัฒนา)
---
 
## ภาพรวม
 
ผู้สนับสนุนมักกังวลว่าเจ้าของโครงการอาจนำเงินไปใช้ผิดวัตถุประสงค์ InnovateFund แก้ปัญหานี้โดย
 
1. เงินที่ระดมได้ถูกล็อกไว้ใน Smart Contract เจ้าของโครงการ **ถอนเองไม่ได้**
2. เจ้าของส่งหลักฐานความสำเร็จของแต่ละ Milestone (เช่น ลิงก์ IPFS) เพื่อขอเบิกเงิน
3. ผู้สนับสนุนโหวตโดยใช้ **น้ำหนักตามจำนวน ETH** ที่สนับสนุน ถ้าเห็นชอบเกิน 50% สัญญาจ่ายเงินให้ทันที
4. ถ้าระดมทุนไม่ถึงเป้าเมื่อหมดเวลา ผู้สนับสนุนขอ **คืนเงิน** ได้เต็มจำนวน
## ฟีเจอร์
 
| # | ฟีเจอร์ | ฟังก์ชันในสัญญา |
|---|---|---|
| 1 | สร้างโครงการระดมทุน | `createCampaign` |
| 2 | สนับสนุนเงินทุน | `contribute` |
| 3 | ติดตามยอดระดมทุน | `getCampaignDetails`, `getFundingProgress` |
| 4 | ขอเบิกเงินตาม Milestone | `requestMilestoneRelease` |
| 5 | โหวตอนุมัติและจ่ายเงิน | `voteMilestone` |
| 6 | คืนเงินเมื่อระดมทุนไม่สำเร็จ | `refund` |
| 7 | ความโปร่งใสทางการเงิน | `getTransparency`, `getMilestones`, Events |
 
### หน้าเว็บ
 
| Route | หน้า |
|---|---|
| `/` | Landing Page, สถิติ, Featured Campaigns, How It Works |
| `/campaigns` | รายการโครงการ ค้นหา กรอง เรียงลำดับ |
| `/campaigns/:id` | รายละเอียดโครงการ, Milestone Timeline, ผู้สนับสนุน, ประวัติธุรกรรม, ฟอร์มสนับสนุน |
| `/campaigns/:id/milestones` | ขอเบิกเงิน (เจ้าของ) และโหวต (ผู้สนับสนุน) |
| `/create` | สร้างโครงการ พร้อม Preview |
| `/dashboard` | แดชบอร์ดตาม Wallet ที่เชื่อมต่อ |
| `/transparency` | สรุปเงินเข้า/ออก/คงเหลือ กราฟ และตารางธุรกรรม |
| `/refunds` | ตรวจสอบสิทธิ์และขอคืนเงิน |
 
ทุกธุรกรรมมี Confirmation Modal และแสดงสถานะ **Confirm → Wallet → Pending → Done/Failed** พร้อมลิงก์ Sepolia Etherscan
 
## Tech Stack
 
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Lucide React, React Hot Toast
- **Web3:** ethers.js v6, MetaMask
- **Smart Contract:** Solidity ^0.8.20, พัฒนาและ Deploy ด้วย Remix IDE
- **Network:** Ethereum Sepolia Testnet (Chain ID `11155111`)
ไม่มี Backend หรือ Database — ข้อมูลทั้งหมดอ่านจาก Smart Contract และ Event Logs โดยตรง
 
## โครงสร้างโปรเจกต์
 
```
.
├── contracts/
│   └── InnovateFund.sol          # Smart Contract (คัดลอกไปวางใน Remix)
├── src/
│   ├── components/
│   │   ├── layout/               # Navbar, Footer, Sidebar
│   │   ├── wallet/               # ConnectWallet, WalletInfo
│   │   ├── campaigns/            # CampaignCard, FundingProgress, ContributionForm, MilestoneCard
│   │   └── ui/                   # TransactionModal, EmptyState, LoadingSpinner, StatCard
│   ├── pages/                    # Home, Campaigns, CampaignDetails, CreateCampaign,
│   │                             # Dashboard, Milestones, Transparency, Refunds
│   ├── hooks/                    # useWallet, useCampaigns, useTransactions, useTxFlow
│   ├── services/blockchain.ts    # ติดต่อ Smart Contract (อ่าน/เขียน/แปลง error)
│   ├── contracts/InnovateFundABI.json
│   ├── config/contract.ts        # Environment + ค่าคงที่ของ Sepolia
│   ├── utils/format.ts           # จัดรูปแบบ ETH, เวลา, ตรวจ Evidence URL
│   └── types/index.ts
├── .env.example
└── package.json
```
 
> หมายเหตุ: ไฟล์ `InnovateFund.sol` ให้วางไว้ในโฟลเดอร์ `contracts/` ของ repo เพื่อให้ผู้ตรวจดูโค้ดสัญญาได้
 
## Smart Contract
 
กฎสำคัญที่สัญญาบังคับใช้เอง (ไม่พึ่ง Frontend):
 
- ผลรวมเงิน Milestone ต้อง **เท่ากับ** เป้าหมายเงินทุน
- รับเงินได้เฉพาะช่วงที่ยังไม่หมดเวลาและยังไม่ถึงเป้า (รับไม่เกินเป้า)
- เจ้าของโครงการสนับสนุนโครงการตัวเองไม่ได้
- Milestone ต้องดำเนินการ **ตามลำดับ** และห้ามเบิกซ้ำ
- เฉพาะ Wallet ที่สนับสนุนเท่านั้นที่โหวตได้ โหวตได้ **1 ครั้งต่อ Milestone** น้ำหนักตามจำนวน ETH
- อนุมัติเมื่อคะแนนเห็นชอบ **> 50%** ของยอดระดมทุนทั้งหมด → จ่ายเงินทันที
- ถ้าคะแนนไม่เห็นชอบ ≥ 50% Milestone จะเป็น `Rejected` เจ้าของส่งหลักฐานใหม่ได้
- Refund ได้เฉพาะโครงการที่ล้มเหลว ตามยอดที่จ่ายจริง ป้องกันการรับซ้ำ
- ป้องกัน Reentrancy (Checks-Effects-Interactions + `nonReentrant`)
- สัญญาไม่มี `receive()` / `fallback()` — โอน ETH ตรง ๆ เข้าสัญญาไม่ได้
สถานะ Campaign: `Funding` → `Successful` → `Completed` หรือ `Failed`
สถานะ Milestone: `NotRequested` → `Pending` → `Released` หรือ `Rejected`
 
**Events** ที่ใช้สร้างประวัติบน Dashboard: `CampaignCreated`, `Contributed`, `MilestoneRequested`, `Voted`, `MilestoneApproved`, `MilestoneRejected`, `FundsReleased`, `Refunded`
 
## การติดตั้งและรันเว็บ
 
### สิ่งที่ต้องมี
- Node.js 18 ขึ้นไป
- MetaMask (Browser Extension)
- Sepolia Test ETH (ขอฟรีจาก Faucet เช่น Google Cloud Web3 Faucet)
### ขั้นตอน
 
```bash
# 1. ติดตั้ง dependencies
npm install
 
# 2. สร้างไฟล์ environment
cp .env.example .env          # Windows: copy .env.example .env
 
# 3. แก้ไฟล์ .env (ดูตารางด้านล่าง) แล้วรัน
npm run dev                   # เปิด http://localhost:5173
```
 
คำสั่งอื่น ๆ
 
```bash
npm run typecheck             # ตรวจ TypeScript
npm run build                 # type-check + production build
npm run preview               # ดูผล build
```
 
### Environment Variables
 
| ตัวแปร | คำอธิบาย |
|---|---|
| `VITE_CONTRACT_ADDRESS` | Address ของสัญญาที่ Deploy บน Sepolia |
| `VITE_SEPOLIA_RPC_URL` | RPC สำหรับอ่านข้อมูล (ค่าเริ่มต้น: `https://ethereum-sepolia-rpc.publicnode.com`) |
| `VITE_DEPLOY_BLOCK` | เลข Block ที่ Deploy สัญญา (ช่วยให้โหลดประวัติธุรกรรมเร็ว) |
| `VITE_LOG_BLOCK_RANGE` | จำนวน Block ต่อการดึง Log หนึ่งครั้ง (ค่าเริ่มต้น `5000` ลดลงถ้า RPC ปฏิเสธ) |
 
> หลังแก้ `.env` ต้องหยุดแล้วรัน `npm run dev` ใหม่ ไฟล์ `.env` ถูกใส่ใน `.gitignore` แล้ว ห้ามนำ Private Key หรือ Seed Phrase มาใส่ในโปรเจกต์
 
ถ้ายังไม่ตั้ง `VITE_CONTRACT_ADDRESS` เว็บจะแสดงแถบ **Contract Not Configured**
 
## Deploy Smart Contract ด้วย Remix
 
1. เปิด [remix.ethereum.org](https://remix.ethereum.org) สร้างไฟล์ `InnovateFund.sol` แล้ววางโค้ดจาก `contracts/InnovateFund.sol`
2. แท็บ **Solidity Compiler** เลือกเวอร์ชัน `0.8.20` ขึ้นไป แล้วกด Compile
3. แท็บ **Deploy & Run Transactions** เลือก Environment เป็น **Injected Provider - MetaMask** (เครือข่าย Sepolia)
4. กด **Deploy** แล้วยืนยันใน MetaMask
5. คัดลอก **Contract Address** และ **เลข Block** ของ Transaction ที่ Deploy ไปใส่ใน `.env`
6. ถ้าแก้ไขสัญญา ให้ Compile ใหม่ แล้วคัดลอก ABI จาก Remix ไปทับ `src/contracts/InnovateFundABI.json`
## วิธีทดสอบระบบ
 
ชุดค่าตัวอย่าง (ใช้ ETH น้อยเพื่อประหยัด Faucet):
 
- Goal: `0.003` ETH, ระยะเวลา `30` Minutes
- Milestone 3 อัน อันละ `0.001` ETH
- ใช้ MetaMask 3 บัญชี: Owner, B, C
| สถานการณ์ | ขั้นตอนย่อ | ผลที่คาดหวัง |
|---|---|---|
| ระดมทุนสำเร็จ | B สนับสนุน `0.002`, C สนับสนุน `0.001` | สถานะ Funded, ผู้สนับสนุนได้น้ำหนัก 66.7% / 33.3% |
| โหวตอนุมัติ | Owner ขอเบิก Milestone 1 → C Approve → B Approve | C คนเดียวยังไม่ผ่าน, เมื่อ B โหวตจ่ายเงินให้ Owner ทันที |
| ปฏิเสธ Milestone | Owner ขอเบิก → B Reject | สถานะ Rejected, Owner ส่งหลักฐานใหม่ได้ |
| คืนเงิน | สร้างโครงการ 2 นาที, B ใส่ไม่ถึงเป้า, รอหมดเวลา | หน้า Refunds ขึ้น Eligible, กดแล้วได้เงินคืน |
 
กรณีที่ควรทดสอบว่าล้มเหลวถูกต้อง:
 
| ทดสอบ | Error ที่ควรได้ |
|---|---|
| Owner สนับสนุนโครงการตัวเอง | `OwnerCannotContribute` |
| สนับสนุน 0 ETH | `ZeroAmount` |
| สนับสนุนเกินยอดที่เหลือ / หลังหมดเวลา | `ExceedsRemainingGoal` / `CampaignNotFunding` |
| บัญชีอื่นขอเบิกเงิน | `NotCampaignOwner` |
| ขอ Milestone ข้ามลำดับ | `MilestoneOutOfOrder` |
| ขอ Milestone ซ้ำขณะ Pending | `MilestoneAlreadyPending` |
| ผู้ไม่เคยสนับสนุนโหวต | `NotContributor` |
| โหวตซ้ำ | `AlreadyVoted` |
| ขอคืนเงินก่อนหมดเวลา / ขอซ้ำ | `CampaignNotFailed` / `NothingToRefund` |
 
## Security
 
- ไม่เก็บ Private Key หรือ Seed Phrase ใน Frontend — ทุกธุรกรรมเซ็นผ่าน MetaMask
- ตรวจ Wallet, Chain ID, จำนวน ETH และ Evidence URL (รับเฉพาะ `https://` และ `ipfs://`) ก่อนส่งธุรกรรม
- การตรวจสอบฝั่ง Frontend เป็นเพียง UX — **สัญญาเป็นผู้บังคับสิทธิ์จริง**
- ป้องกันการกดยืนยันซ้ำระหว่างรอธุรกรรม
- ไม่มีข้อมูลจำลองแสดงเป็นข้อมูล Blockchain
> สัญญานี้ยังไม่ผ่านการ Audit โดยผู้เชี่ยวชาญ เหมาะสำหรับการเรียนรู้และ Testnet เท่านั้น ห้ามนำไปใช้กับเงินจริง
 
## ข้อจำกัดที่ทราบ
 
- Milestone มีช่อง description ช่องเดียวในสัญญา Frontend จึงเก็บเป็นสตริง `ชื่อ::รายละเอียด` แล้วแยกตอนแสดงผล
- ไม่มีกลไกคืนเงินกรณีโครงการระดมทุนสำเร็จแล้วแต่เจ้าของไม่ส่งหลักฐานเลย (เงินจะค้างในสัญญา)
- ประวัติธุรกรรมอ่านจาก Event Logs โดยตรง จึงควรตั้ง `VITE_DEPLOY_BLOCK`
- ปุ่ม Disconnect ทำงานระดับ UI เท่านั้น (MetaMask ไม่เปิดให้เว็บตัดการเชื่อมต่อ)
- ผลรวมของ Milestone ต้องเท่ากับเป้าหมายพอดี และรับเงินไม่เกินเป้าหมาย
## ทีมผู้พัฒนา
 
| ชื่อ | รหัสนักศึกษา |
|---|---|
66002022 | คฑาวุธ เมืองพรหม
66016519 | พบพร จิตโสภา
66050180 | นพรัตน์ สวัสดิ์เอื้อ
66050731 | อชิรยุ นวลสกลุวัฒน์
66031036 | ธนภัทร หนูบุญมี
 
## License
 
MIT (หรือแก้ตามที่อาจารย์/ทีมกำหนด)
 