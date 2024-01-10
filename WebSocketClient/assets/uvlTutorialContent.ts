export const tutorialContent = [{
    title: "Welcome",
    text: "<p>Welcome to the UVL Tutorial! </br>In the following, code listings will be inserted into the editor for further explanation. <span class='warning'>Please be aware that your progress may be lost.</span></br> Click <b>'Next'</b> to start the tutorial.</p>"
}, {
    title: "Basic Feature Model",
    text: "<p>Start with the <b><code class='keyword'>features</code></b> key word to start enumerating your features. Indentations matter in UVL and represent the tree structure.</br>We will start with a basic feature model that represents a computer. Every computer needs a CPU and can optionally have some devices connected via SATA.</p>",
    codeListing: `features
    Computer
        mandatory
            CPU
        optional
            SATADevices`
}, {
    title: "Special Feature Names",
    text: "<p>To use special characters or spaces in feature names use quotes (<b><code class='literal'>\"</code></b>) to enclose the names.</br>In this example we write <b><code class='literal'>SATA-Devices</code></b> with a dash instead of <b><code class='literal'>SATADevices</code></b>.</p>",
    codeListing: `features
    Computer
        mandatory
            CPU
        optional
            "SATA-Devices"`
}, {
    title: "Basic Constraints",
    text: "<p>Use the <b><code class='keyword'>constraints</code></b> keyword to start the section of constraints. In its basic form, a constraint uses propositional logic.</br>In this example, we enforce that if a computer contains a dedicated graphics card, it must also use liquid cooling. We do that with the <b><code>=></code></b> symbol to represent an implication.</br>Other logic connectors are <b><code>&</code></b>, <b><code>|</code></b>, <b><code>not</code></b></p>",
    codeListing: `features
    Computer
        mandatory
            CPU
            "Graphics Card"
                or
                    Dedicated
                    Integrated
            Cooling
                alternative
                    Liquid
                    Air
        optional
            "SATA-Devices"

constraints
    Dedicated => Liquid`
}, {
    title: "Feature Attributes",
    text: "<p>Features can have attributes in curly brackets as key value pairs. The value can be omitted if it is a boolean attribute and the value is true. This is the case for the <b><code class='qualifier'>abstract</code></b> attribute in the feature <b><code class='literal'>Computer</code></b>. We also use attributes to indicate the power consumption of different parts of the computer.</p>",
    codeListing: `features
    Computer {abstract}
        mandatory
            CPU {Power 100, Manufacturer 'Intel'}
            "Graphics Card"
                or
                    Dedicated {powerConsumption 300}
                    Integrated {powerConsumption 100}
            Cooling
                alternative
                    Liquid
                    Air
        optional
            "SATA-Devices"

constraints
    Dedicated => Liquid`
}, {
    title: "Complex Constraints",
    text: "<p>We can now create more complex constraints and for example access attributes of features. In this case we use the aggregate function <b><code>sum</code></b> to sum over all powerConsumption attributes and check if the overall <b><code class='qualifier'>powerConsumption</code></b> is larger than a threshold and if so enforce a stronger power supply unit. You could also access feature attributes and perform basic calculations with them.</p>",
    codeListing: `features
    Computer {abstract}
        mandatory
            CPU {Power 100, Manufacturer 'Intel'}
            "Graphics Card"
                or
                    Dedicated {powerConsumption 300}
                    Integrated {powerConsumption 100}
            Cooling
                alternative
                    Liquid
                    Air
            PSU
                alternative
                    StrongPSU
                    WeakPSU
        optional
            "SATA-Devices"

constraints
    Dedicated => Liquid
    sum(powerConsumption) > 300 => StrongPSU`
}, {
    title: "Group Cardinality",
    text: "<p>Group cardinalities are more generic than <b><code class='keyword'>or</code></b> and <b><code class='keyword'>alternative</code></b>.</br>In our example, the motherboard only has space for up to 2 SATA-Devices. So we enforce that there are 0, 1, or 2 SATA-Devices.</p>",
    codeListing: `features
    Computer {abstract}
        mandatory
            CPU {Power 100, Manufacturer 'Intel'}
            "Graphics Card"
                or
                    Dedicated {powerConsumption 300}
                    Integrated {powerConsumption 100}
            Cooling
                alternative
                    Liquid
                    Air
            PSU
                alternative
                    StrongPSU
                    WeakPSU
        optional
            "SATA-Devices"
                [0..2]
                    HDD {powerConsumption 10}
                    SSD {powerConsumption 5}
                    "DVD-Drive" {powerConsumption 5}

constraints
    Dedicated => Liquid
    sum(powerConsumption) > 300 => StrongPSU`
}, {
    title: "Feature Cardinality",
    text: "<p>Feature Cardinality allows a feature to be selected multiple times. In our example, we can use up to 4 ram bars.</p>",
    codeListing: `features
    Computer {abstract}
        mandatory
            CPU {Power 100, Manufacturer 'Intel'}
            "Graphics Card"
                or
                    Dedicated {powerConsumption 300}
                    Integrated {powerConsumption 100}
            Cooling
                alternative
                    Liquid
                    Air
            PSU
                alternative
                    StrongPSU
                    WeakPSU
            RAM cardinality [1..4] {powerConsumption 10}
        optional
            "SATA-Devices"
                [0..2]
                    HDD {powerConsumption 10}
                    SSD {powerConsumption 5}
                    "DVD-Drive" {powerConsumption 5}

constraints
    Dedicated => Liquid
    sum(powerConsumption) > 300 => StrongPSU`
}, {
    title: "Types",
    text: "<p>In UVL, you can use types to create special features. In this case, we change the power supply unit. It has a <b><code class='qualifier'>Manufacturer</code></b> feature of the type <b><code>String</code></b> and a <b><code class='qualifier'>Watt</code></b> feature of the type <b><code>Integer</code></b>.</br>This means, when configuring the feature model, the features are not just selected or deselected, but get a value of their corresponding type. We can utilize this for even more complex constraints and check if the manufacturer of the CPU and the PSU match.</p>",
    codeListing: `features
    Computer {abstract}
        mandatory
            CPU {Power 100, Manufacturer 'Intel'}
            "Graphics Card"
                or
                    Dedicated {powerConsumption 300}
                    Integrated {powerConsumption 100}
            Cooling
                alternative
                    Liquid
                    Air
            PSU
                optional
                    String Manufacturer
                    Integer Watt
            RAM cardinality [1..4] {powerConsumption 10}
        optional
            "SATA-Devices"
                [0..2]
                    HDD {powerConsumption 10}
                    SSD {powerConsumption 5}
                    "DVD-Drive" {powerConsumption 5}

constraints
    Dedicated => Liquid
    sum(powerConsumption) < Watt
    CPU.Manufacturer == Manufacturer`
}, {
    title: "The End",
    text: "<p>Now you have a basic understanding of the Universal Variability Language. Go on and use the playground to test the language.</br>If you plan on using the language more frequently we recommend installing the </br><a href='https://marketplace.visualstudio.com/items?itemName=caradhras.uvls-code'>'UVLS - Universal Variability Language Server'</a></br> VS-Code extension, because it provides more features.</br>Press the 'Done' button to close the tutorial.</p>"
}]