class LabOnChipSimulation {
    constructor() {
        this.canvas = document.getElementById('chipCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Simulation states
        this.isPlaying = false;
        this.currentStep = 0;
        this.simulationTime = 0;
        this.speed = 1;
        this.flowRate = 0.5;
        
        // Animation frames
        this.animationId = null;
        this.lastTime = 0;
        
        // Drug flow states
        this.drugFrontPosition = 0;
        this.diffusionLevel = 0;
        this.flowParticles = [];
        this.drugParticles = [];
        this.diffusionParticles = [];
        
        // Cell structuress
        this.motorNeurons = [];
        this.schwannCells = [];
        this.axons = [];
        
        // Component regions for hover detection
        this.components = [];
        
        // Initialize
        this.setupEventListeners();
        this.initializeStructures();
        this.initializeComponents();
        this.updateLegend();
        this.loadStep(0);
        this.render();
    }
    
    // Tutorial steps and descriptions
    steps = [
        {
            title: "Device Overview",
            description: `<p></p>
                <p>This microfluidic device models a peripheral nerve for drug testing. It contains:</p>
                <ul>
                    <li><strong>Two Medium Channels</strong> (blue) - top & bottom for nutrient flow</li>
                    <li><strong>ECM Hydrogel Region</strong> (pink) - central matrix housing cells</li>
                    <li><strong>Motor Neurons</strong> (green) - along top, extending axons downward</li>
                    <li><strong>Schwann Cells</strong> (yellow-green) - elongated cells in hydrogel</li>
                    <li><strong>Medium Reservoirs</strong> - spherical ports for fluid I/O</li>
                </ul>`,
            highlight: "all"
        },
        {
            title: "Precondition: Living Tissue Ready",
            description: `<p>The chip is assembled, sterilized, and living tissue is engineered inside.</p>
                <ul>
                    <li>Motor neuron cell bodies positioned along top channel</li>
                    <li>Axons extending downward through the hydrogel</li>
                    <li>Schwann cells wrapping around axons (myelination)</li>
                    <li>Fresh culture medium flowing through both channels</li>
                </ul>
                <p style="color: #00ff88;">The system is ready for drug testing</p>`,
            highlight: "cells"
        },
        {
            title: "Step 1: Drug Solution Preparation",
            description: `<p>A syringe with drug solution is attached to the inlet reservoirs.</p>
                <ul>
                    <li>Drug dissolved in culture medium</li>
                    <li>Precise concentration prepared</li>
                    <li>Connected to Medium Reservoirs (left side)</li>
                </ul>
                <p style="color: #ff6b6b;">The drug solution ready for injection</p>`,
            highlight: "inlet"
        },
        {
            title: "Step 2: Flow Initiation",
            description: `<p>The syringe pump activates at a very slow flow rate.</p>
                <ul>
                    <li>Flow rate: 0.5 µL/min (adjustable)</li>
                    <li>Laminar flow - no turbulent mixing</li>
                    <li>Drug pushes old medium in plug-like manner</li>
                    <li>Clear interface maintained between solutions</li>
                </ul>
                <p style="color: #00d9ff;">Watch the drug solution enter the channels</p>`,
            highlight: "flow",
            action: "startDrugFlow"
        },
        {
            title: "Step 3: Channel Perfusion",
            description: `<p>Drug solution flows along both Medium Channels.</p>
                <ul>
                    <li>Flows parallel to the ECM Hydrogel region</li>
                    <li>Flow maintained for hours to days</li>
                    <li>Creates uniform exposure zone</li>
                </ul>
                <p style="color: #00d9ff;">Drug advancing through channels</p>`,
            highlight: "channels",
            action: "continueDrugFlow"
        },
        {
            title: "Step 4: Drug Diffusion",
            description: `<p>Drug molecules begin diffusing into the hydrogel:</p>
                <ul>
                    <li>Movement down concentration gradient</li>
                    <li>Crosses from channels into ECM Hydrogel</li>
                    <li>Diffusion from both top and bottom channels</li>
                    <li>PDMS posts don't block diffusion</li>
                </ul>
                <p style="color: #ffa500;">Watch molecules spread into the gel</p>`,
            highlight: "diffusion",
            action: "startDiffusion"
        },
        {
            title: "Step 5: Drug Reaches Cells",
            description: `<p>Drugs diffuse through ECM to reach neural tissue:</p>
                <ul>
                    <li>ECM acts like extracellular space in body</li>
                    <li>Reaches motor neuron cell bodies</li>
                    <li>Contacts axons and Schwann cells</li>
                    <li>Cells respond to drug exposure</li>
                </ul>
                <p style="color: #ff6b6b;">Drug interacting with neurons</p>`,
            highlight: "cells",
            action: "drugReachesCells"
        },
        {
            title: "Step 6: Observation & Washout",
            description: `<p>Measurements are taken, then drug is washed out:</p>
                <ul>
                    <li>Live-cell imaging or electrical recording</li>
                    <li>Observations at specific time points</li>
                    <li>After exposure: switch to fresh medium</li>
                    <li>Flush drug from system</li>
                </ul>
                <p style="color: #00ff88;">The experiment is complete and data is collected</p>`,
            highlight: "all",
            action: "washout"
        }
    ];
    
    // Component information for hover display
    componentInfo = {
        mediumChannel: {
            title: "Medium Channel",
            description: "Microfluidic channels (top & bottom) carrying culture medium and drug solutions. Laminar flow ensures predictable, plug-like drug delivery without turbulent mixing."
        },
        hydrogel: {
            title: "ECM Hydrogel",
            description: "Central region filled with extracellular matrix (Collagen or Matrigel). Mimics the extracellular space in the body and provides scaffolding for neural tissue."
        },
        neuron: {
            title: "Motor Neurons",
            description: "Living motor neurons positioned along the top channel. Their cell bodies extend long axons downward through the hydrogel toward the bottom channel."
        },
        schwannCell: {
            title: "Schwann Cells",
            description: "Elongated supporting cells that wrap around axons to create myelin sheaths. Essential for modeling myelinated peripheral nerves."
        },
        reservoir: {
            title: "Medium Reservoir",
            description: "Spherical ports where syringes connect to introduce or collect fluids. Left reservoirs are inlets, right reservoirs are outlets."
        },
        hydrogelPort: {
            title: "Hydrogel Injection Port",
            description: "Central port used to load the cell-hydrogel mixture into the central chamber during initial chip assembly."
        }
    };
    
    // Key
    legendItems = [
        { color: "#4a90d9", label: "Medium Channel (flowing)" },
        { color: "#FFB6C1", label: "ECM Hydrogel" },
        { color: "#90EE90", label: "Motor Neurons" },
        { color: "#9ACD32", label: "Schwann Cells" },
        { color: "#ff4444", label: "Drug Solution" },
    ];
    
    // Setup event listeners for UI controls
    setupEventListeners() {
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlay());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('nextStepBtn').addEventListener('click', () => this.nextStep());
        
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.speed + 'x';
        });
        
        this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
        this.canvas.addEventListener('mouseleave', () => this.hideComponentInfo());
        document.getElementById('closeInfo').addEventListener('click', () => this.hideComponentInfo());
    }
    
    initializeStructures() {
        // Define layout dimensions matching reference images
        this.layout = {
            chipX: 100, chipY: 60, chipW: 600, chipH: 380,
            
            // Top medium channel (blue)
            topChannelY: 80, channelHeight: 45,
            
            // Hydrogel region (pink) - between channels
            hydrogelY: 125, hydrogelHeight: 250,
            
            // Bottom medium channel (blue)
            bottomChannelY: 375,
            
            // Channel horizontal extent
            channelStartX: 180, channelEndX: 620
        };
        
        // Motor Neurons - small round cells with nuclei along top of hydrogel
        // Resembling the reference image's small circles with inner circles
        const neuronCount = 10;
        for (let i = 0; i < neuronCount; i++) {
            const x = 195 + i * 43;
            this.motorNeurons.push({
                x: x,
                y: 140 + (Math.random() - 0.5) * 15,
                radius: 10,
                phase: Math.random() * Math.PI * 2,
                drugExposure: 0
            });
        }
        
        // Axons extending from neurons downward (thin lines)
        this.motorNeurons.forEach((neuron, i) => {
            this.axons.push({
                startX: neuron.x,
                startY: neuron.y + neuron.radius,
                endX: neuron.x + (Math.random() - 0.5) * 20,
                endY: 365,
                drugExposure: 0
            });
        });
        
        // Schwann Cells - elongated yellowish-green cells in the hydrogel
        // Positioned in rows in the middle section
        const schwannPositions = [
            // Row 1
            { x: 220, y: 280 }, { x: 310, y: 285 }, { x: 400, y: 275 }, 
            { x: 490, y: 280 }, { x: 580, y: 285 },
            // Row 2
            { x: 250, y: 330 }, { x: 350, y: 325 }, { x: 450, y: 335 }, 
            { x: 550, y: 328 }
        ];
        
        schwannPositions.forEach(pos => {
            this.schwannCells.push({
                x: pos.x,
                y: pos.y,
                width: 50 + Math.random() * 15,
                height: 18 + Math.random() * 6,
                rotation: (Math.random() - 0.5) * 0.4,
                drugExposure: 0
            });
        });
        
        // Flow particles in channels
        for (let i = 0; i < 12; i++) {
            this.flowParticles.push({
                // Random x and y within top channel length
                x: 180 + Math.random() * 440,
                y: this.layout.topChannelY + 10 + Math.random() * 25,
                speed: 0.4 + Math.random() * 0.3,
                size: 2.5,
                channel: 'top'
            });
            this.flowParticles.push({
                // Random x and y within bottom channel length
                x: 180 + Math.random() * 440,
                y: this.layout.bottomChannelY + 10 + Math.random() * 25,
                speed: 0.4 + Math.random() * 0.3,
                size: 2.5,
                channel: 'bottom'
            });
        }
    }
    
    // Component regions for hover detection
    initializeComponents() {
        const L = this.layout;
        this.components = [
            { type: 'mediumChannel', x: L.channelStartX, y: L.topChannelY, width: L.channelEndX - L.channelStartX, height: L.channelHeight },
            { type: 'mediumChannel', x: L.channelStartX, y: L.bottomChannelY, width: L.channelEndX - L.channelStartX, height: L.channelHeight },
            { type: 'hydrogel', x: L.channelStartX, y: L.hydrogelY, width: L.channelEndX - L.channelStartX, height: L.hydrogelHeight },
            { type: 'reservoir', x: 105, y: 70, width: 45, height: 45 },
            { type: 'reservoir', x: 105, y: 365, width: 45, height: 45 },
            { type: 'reservoir', x: 650, y: 70, width: 45, height: 45 },
            { type: 'reservoir', x: 650, y: 365, width: 45, height: 45 },
            { type: 'hydrogelPort', x: 100, y: 225, width: 35, height: 35 }
        ];
        
        // Add motor neurons and schwann cells as individual components
        this.motorNeurons.forEach(n => {
            this.components.push({ type: 'neuron', x: n.x - 12, y: n.y - 12, width: 24, height: 24 });
        });
        
        this.schwannCells.forEach(s => {
            this.components.push({ type: 'schwannCell', x: s.x - s.width/2, y: s.y - s.height/2, width: s.width, height: s.height });
        });
    }
    
    // Update legend display
    updateLegend() {
        const container = document.getElementById('legendItems');
        container.innerHTML = this.legendItems.map(item => `
            <div class="legend-item">
                <div class="legend-color" style="background: ${item.color}"></div>
                <span>${item.label}</span>
            </div>
        `).join('');
    }
    
    // Load a specific tutorial step
    loadStep(stepIndex) {
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        document.getElementById('currentStep').textContent = `Step ${stepIndex + 1}`;
        document.getElementById('totalSteps').textContent = this.steps.length;
        document.getElementById('stepTitle').textContent = step.title;
        document.getElementById('stepDescription').innerHTML = step.description;
        
        if (step.action) {
            this[step.action]();
        }
    }
    
    // Navigate to the next tutorial step
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.loadStep(this.currentStep + 1);
        } else {
            this.loadStep(0);
            this.reset();
        }
    }
    
    // Play/pause toggle
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        document.getElementById('playPauseBtn').textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
        
        if (this.isPlaying) {
            this.lastTime = performance.now();
            this.animate();
        } else {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    // Reset simulation to initial state
    reset() {
        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶ Play';
        cancelAnimationFrame(this.animationId);
        
        this.simulationTime = 0;
        this.drugFrontPosition = 0;
        this.diffusionLevel = 0;
        this.drugParticles = [];
        this.diffusionParticles = [];
        
        this.motorNeurons.forEach(n => n.drugExposure = 0);
        this.axons.forEach(a => a.drugExposure = 0);
        this.schwannCells.forEach(s => s.drugExposure = 0);
        
        this.loadStep(0);
        this.render();
    }
    
    // Action methods
    startDrugFlow() { this.drugFrontPosition = 0; }
    continueDrugFlow() {}
    startDiffusion() {
        if (this.diffusionParticles.length === 0) {
            // From top channel
            for (let i = 0; i < 25; i++) {
                this.diffusionParticles.push({
                    x: 200 + Math.random() * 400,
                    y: 125,
                    targetY: 180 + Math.random() * 150,
                    speed: 0.12 + Math.random() * 0.15,
                    size: 3,
                    alpha: 1,
                    direction: 1
                });
            }
            // From bottom channel
            for (let i = 0; i < 25; i++) {
                this.diffusionParticles.push({
                    x: 200 + Math.random() * 400,
                    y: 375,
                    targetY: 280 + Math.random() * 80,
                    speed: 0.12 + Math.random() * 0.15,
                    size: 3,
                    alpha: 1,
                    direction: -1
                });
            }
        }
    }
    
    // Drug reaches cells
    drugReachesCells() {
        this.diffusionLevel = Math.max(this.diffusionLevel, 0.5);
    }
    
    // Washout
    washout() {}
    
    // Main animation loop
    animate() {
        if (!this.isPlaying) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000 * this.speed;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // Update simulation state
    update(dt) {
        this.simulationTime += dt;
        
        // Flow particles
        this.flowParticles.forEach(p => {
            p.x += p.speed * this.flowRate * 60 * dt;
            if (p.x > 610) p.x = 190;
        });
        
        // Drug front (steps 3+)
        if (this.currentStep >= 3) {
            // Update drug front position
            this.drugFrontPosition = Math.min(1, this.drugFrontPosition + dt * 0.07 * this.flowRate);
            
            // Generate drug particles at inlet
            if (Math.random() < 0.35 && this.drugParticles.length < 50) {
                this.drugParticles.push({
                    x: 185,
                    y: this.layout.topChannelY + 12 + Math.random() * 20,
                    speed: 0.5 + Math.random() * 0.3,
                    size: 3.5
                });
                this.drugParticles.push({
                    x: 185,
                    y: this.layout.bottomChannelY + 12 + Math.random() * 20,
                    speed: 0.5 + Math.random() * 0.3,
                    size: 3.5
                });
            }
        }
        
        // Update drug particles
        this.drugParticles.forEach(p => {
            p.x += p.speed * this.flowRate * 70 * dt;
        });
        this.drugParticles = this.drugParticles.filter(p => p.x < 615);
        
        // Diffusion (steps 5+)
        if (this.currentStep >= 5) {
            this.diffusionLevel = Math.min(1, this.diffusionLevel + dt * 0.035);
            
            // Update diffusion particles
            this.diffusionParticles.forEach(p => {
                const dir = p.direction;
                if ((dir > 0 && p.y < p.targetY) || (dir < 0 && p.y > p.targetY)) {
                    p.y += dir * p.speed * 45 * dt;
                }
                p.x += (Math.random() - 0.5) * 20 * dt;
            });
            
            // Remove particles that reached target
            const rate = dt * 0.07 * this.diffusionLevel;
            this.motorNeurons.forEach(n => n.drugExposure = Math.min(1, n.drugExposure + rate));
            this.axons.forEach(a => a.drugExposure = Math.min(1, a.drugExposure + rate * 0.7));
            this.schwannCells.forEach(s => s.drugExposure = Math.min(1, s.drugExposure + rate * 0.5));
        }
        
        // Washout
        if (this.currentStep === 7 && this.simulationTime > 5) {
            this.diffusionLevel = Math.max(0, this.diffusionLevel - dt * 0.06);
            this.motorNeurons.forEach(n => n.drugExposure = Math.max(0, n.drugExposure - dt * 0.03));
            this.schwannCells.forEach(s => s.drugExposure = Math.max(0, s.drugExposure - dt * 0.03));
        }
    }
    
    // Render the entire simulation
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear - dark background matching the UI theme
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        
        this.drawChipBase(ctx);
        this.drawChannelConnections(ctx);
        this.drawMediumChannels(ctx);
        this.drawHydrogel(ctx);
        this.drawAxons(ctx);
        this.drawSchwannCells(ctx);
        this.drawMotorNeurons(ctx);
        this.drawFlowParticles(ctx);
        this.drawDrugParticles(ctx);
        this.drawDiffusionParticles(ctx);
        this.drawReservoirs(ctx);
        this.drawHydrogelPort(ctx);
        this.drawLabels(ctx);
        this.drawHighlight(ctx);
    }
    
    // Render the entire simulation
    drawChipBase(ctx) {
        // Dark semi-transparent chip body
        ctx.fillStyle = 'rgba(40, 44, 62, 0.6)';
        ctx.strokeStyle = '#444466';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.roundRect(ctx, 95, 55, 630, 400, 12);
        ctx.fill();
        ctx.stroke();
    }
    
    // Render the entire simulation
    drawChannelConnections(ctx) {
        // Connections between reservoirs and channels - darker
        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(145, this.layout.topChannelY + 15, 35, 15);
        ctx.fillRect(620, this.layout.topChannelY + 15, 35, 15);
        ctx.fillRect(145, this.layout.bottomChannelY + 15, 35, 15);
        ctx.fillRect(620, this.layout.bottomChannelY + 15, 35, 15);
        // Hydrogel port connection
        ctx.fillRect(130, 238, 50, 8);
    }
    
    // Render the entire simulation
    drawMediumChannels(ctx) {
        const L = this.layout;
        const channelWidth = L.channelEndX - L.channelStartX;
        
        // Top channel - darker blue for dark theme
        ctx.fillStyle = '#4a90d9';
        ctx.beginPath();
        this.roundRect(ctx, L.channelStartX, L.topChannelY, channelWidth, L.channelHeight, 3);
        ctx.fill();
        
        // Drug gradient overlay on top channel
        if (this.drugFrontPosition > 0) {
            const drugWidth = channelWidth * this.drugFrontPosition;
            const gradient = ctx.createLinearGradient(L.channelStartX, 0, L.channelStartX + drugWidth, 0);
            gradient.addColorStop(0, 'rgba(255, 50, 50, 0.9)');
            gradient.addColorStop(0.7, 'rgba(255, 80, 80, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 100, 100, 0.4)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            this.roundRect(ctx, L.channelStartX, L.topChannelY, drugWidth, L.channelHeight, 3);
            ctx.fill();
        }
        
        // Bottom channel - darker blue
        ctx.fillStyle = '#4a90d9';
        ctx.beginPath();
        this.roundRect(ctx, L.channelStartX, L.bottomChannelY, channelWidth, L.channelHeight, 3);
        ctx.fill();
        
        // Drug gradient overlay on bottom channel
        if (this.drugFrontPosition > 0) {
            const drugWidth = channelWidth * this.drugFrontPosition;
            const gradient = ctx.createLinearGradient(L.channelStartX, 0, L.channelStartX + drugWidth, 0);
            gradient.addColorStop(0, 'rgba(255, 50, 50, 0.9)');
            gradient.addColorStop(0.7, 'rgba(255, 80, 80, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 100, 100, 0.4)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            this.roundRect(ctx, L.channelStartX, L.bottomChannelY, drugWidth, L.channelHeight, 3);
            ctx.fill();
        }
    }
    
    // Render the entire simulation
    drawHydrogel(ctx) {
        const L = this.layout;
        
        // Pink hydrogel
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(L.channelStartX, L.hydrogelY, L.channelEndX - L.channelStartX, L.hydrogelHeight);
        
        // Diffusion gradient overlay
        if (this.diffusionLevel > 0) {
            const alpha = this.diffusionLevel * 0.45;
            // Render top diffusion gradient
            const gt = ctx.createLinearGradient(0, L.hydrogelY, 0, L.hydrogelY + L.hydrogelHeight * 0.5);
            gt.addColorStop(0, `rgba(255, 90, 90, ${alpha})`);
            gt.addColorStop(1, 'rgba(255, 90, 90, 0)');
            ctx.fillStyle = gt;
            ctx.fillRect(L.channelStartX, L.hydrogelY, L.channelEndX - L.channelStartX, L.hydrogelHeight * 0.5);
            
            // Render bottom diffusion gradient
            const gb = ctx.createLinearGradient(0, L.hydrogelY + L.hydrogelHeight, 0, L.hydrogelY + L.hydrogelHeight * 0.5);
            gb.addColorStop(0, `rgba(255, 90, 90, ${alpha})`);
            gb.addColorStop(1, 'rgba(255, 90, 90, 0)');
            ctx.fillStyle = gb;
            ctx.fillRect(L.channelStartX, L.hydrogelY + L.hydrogelHeight * 0.5, L.channelEndX - L.channelStartX, L.hydrogelHeight * 0.5);
        }
    }
    
    // Render the axons
    drawAxons(ctx) {
        this.axons.forEach(axon => {
            const exp = axon.drugExposure;
            ctx.strokeStyle = exp > 0.2 
                ? `rgba(${100 + exp * 155}, ${180 - exp * 80}, ${100 - exp * 50}, 0.5)` 
                : 'rgba(120, 180, 120, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(axon.startX, axon.startY);
            const midY = (axon.startY + axon.endY) / 2;
            const wave = Math.sin(this.simulationTime * 1.5) * 4;
            ctx.quadraticCurveTo(axon.startX + wave, midY, axon.endX, axon.endY);
            ctx.stroke();
        });
    }
    
    // Render the Schwann cells
    drawSchwannCells(ctx) {
        this.schwannCells.forEach(cell => {
            ctx.save();
            ctx.translate(cell.x, cell.y);
            ctx.rotate(cell.rotation);
            
            const exp = cell.drugExposure;
            // Yellowish-green cell
            ctx.fillStyle = exp > 0.3 
                ? `rgba(${160 + exp * 80}, ${200 - exp * 60}, ${50 + exp * 60}, 0.9)`
                : '#9ACD32';
            
            ctx.beginPath();
            ctx.ellipse(0, 0, cell.width/2, cell.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Nucleus
            ctx.fillStyle = '#556B2F';
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    // Render the motor neurons
    drawMotorNeurons(ctx) {
        this.motorNeurons.forEach(neuron => {
            const pulse = Math.sin(this.simulationTime * 2.5 + neuron.phase) * 0.06 + 1;
            const r = neuron.radius * pulse;
            const exp = neuron.drugExposure;
            
            // Cell body - light green turning more red when exposed
            ctx.fillStyle = exp > 0.3
                ? `rgba(${144 + exp * 100}, ${238 - exp * 120}, ${144 - exp * 100}, 1)`
                : '#90EE90';
            
            ctx.beginPath();
            ctx.arc(neuron.x, neuron.y, r, 0, Math.PI * 2);
            ctx.fill();
            
            // Nucleus (inner circle)
            ctx.fillStyle = exp > 0.3 ? '#993333' : '#228B22';
            ctx.beginPath();
            ctx.arc(neuron.x, neuron.y, r * 0.45, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Render the flow particles
    drawFlowParticles(ctx) {
        ctx.fillStyle = 'rgba(65, 125, 175, 0.55)';
        this.flowParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Render the drug particles
    drawDrugParticles(ctx) {
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        this.drugParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Render the diffusion particles
    drawDiffusionParticles(ctx) {
        this.diffusionParticles.forEach(p => {
            ctx.fillStyle = `rgba(255, 70, 70, ${p.alpha * 0.65})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Render the reservoirs
    drawReservoirs(ctx) {
        const reservoirs = [
            { x: 127, y: 102, inlet: true },
            { x: 127, y: 397, inlet: true },
            { x: 673, y: 102, inlet: false },
            { x: 673, y: 397, inlet: false }
        ];
        
        // Render the reservoirs
        reservoirs.forEach(res => {
            const grad = ctx.createRadialGradient(res.x - 4, res.y - 4, 0, res.x, res.y, 22);
            
            // Color based on inlet/outlet and current step
            if (res.inlet && this.currentStep >= 3) {
                grad.addColorStop(0, '#ff7777');
                grad.addColorStop(0.6, '#cc4444');
                grad.addColorStop(1, '#8B0000');
            } else {
                grad.addColorStop(0, '#CD8C6C');
                grad.addColorStop(0.6, '#8B5A3C');
                grad.addColorStop(1, '#5C3D2E');
            }
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(res.x, res.y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(res.x - 6, res.y - 6, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Render the hydrogel port
    drawHydrogelPort(ctx) {
        const grad = ctx.createRadialGradient(117, 242, 0, 117, 242, 11);
        grad.addColorStop(0, '#5588aa');
        grad.addColorStop(1, '#334455');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(117, 242, 11, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Render the labels
    drawLabels(ctx) {
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#a0a0a0';
        ctx.textAlign = 'center';
        
        ctx.fillText('Medium Channel', 400, 72);
        ctx.fillText('Medium Channel', 400, 438);
        ctx.fillText('ECM Hydrogel', 400, 250);
        
        ctx.font = '9px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('Motor neurons', 400, 165);
        ctx.fillText('Schwann cells', 310, 305);
        
        ctx.font = '8px Arial';
        ctx.fillText('Inlet', 127, 75);
        ctx.fillText('Outlet', 673, 75);
    }
    
    // Render the highlight for current step
    drawHighlight(ctx) {
        const step = this.steps[this.currentStep];
        if (!step.highlight || step.highlight === 'all') return;
        
        const pulse = Math.sin(this.simulationTime * 4) * 0.3 + 0.7;
        const L = this.layout;
        
        ctx.strokeStyle = `rgba(255, 100, 100, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        
        // Highlight based on current step
        switch (step.highlight) {
            case 'inlet':
                ctx.beginPath();
                ctx.arc(127, 102, 26, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(127, 397, 26, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'channels':
            case 'flow':
                ctx.strokeRect(L.channelStartX - 3, L.topChannelY - 3, L.channelEndX - L.channelStartX + 6, L.channelHeight + 6);
                ctx.strokeRect(L.channelStartX - 3, L.bottomChannelY - 3, L.channelEndX - L.channelStartX + 6, L.channelHeight + 6);
                break;
            case 'diffusion':
                ctx.strokeRect(L.channelStartX - 3, L.hydrogelY - 3, L.channelEndX - L.channelStartX + 6, L.hydrogelHeight + 6);
                break;
            case 'cells':
                this.motorNeurons.forEach(n => {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
                    ctx.stroke();
                });
                break;
        }
        ctx.setLineDash([]);
    }

    // Utility: draw rounded rectangle
    roundRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    
    // Handle mouse hover events
    handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        for (const comp of this.components) {
            if (x >= comp.x && x <= comp.x + comp.width && y >= comp.y && y <= comp.y + comp.height) {
                this.showComponentInfo(comp.type);
                return;
            }
        }
        this.hideComponentInfo();
    }
    
    //  get component info and display
    showComponentInfo(type) {
        const info = this.componentInfo[type];
        if (!info) return;
        document.getElementById('infoTitle').textContent = info.title;
        document.getElementById('infoDescription').textContent = info.description;
        document.getElementById('componentInfo').classList.add('visible');
    }
    
    // Hide component info display
    hideComponentInfo() {
        document.getElementById('componentInfo').classList.remove('visible');
    }
}

// Initialize simulation on page load
document.addEventListener('DOMContentLoaded', () => {
    window.simulation = new LabOnChipSimulation();
});
