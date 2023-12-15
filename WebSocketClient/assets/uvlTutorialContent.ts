export const tutorialContent = [{
    title: "Welcome",
    text: "Welcome to the UVL Tutorial! All code listings will automatically be placed in the editor on the left. Click 'Next' to start the tutorial."
}, {
    title: "Basic Feature Model",
    text: "Start with the 'features' key word to start enumerating your features. Indentations matter in UVL and represent the tree structure. We will start with a basic feature model that represents a computer. Every computer needs a CPU and can optionaly have some devices connected via SATA.",
    codeListing: `features
    Computer
        mandatory
            CPU
        optional
            SATADevices`
}, {
    title: "Special Feature Names",
    text: "To use special characters or spaces in feature names use \" to enclose the names.",
    codeListing: `features
    Computer
        mandatory
            CPU
        optional
            "SATA-Devices"`
}, {
    title: "Basic Constraints",
    text: "Use the 'constraints' keyword to start the section of constraints. In its basic form, a constraint uses propositional logic. In this example we enforce that if a computer contains a dedicated graphics card, it must also use liquid cooling. ",
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
    text: "Features can have attributes in curly brackets as key value pairs. The value can be omitted if it is a boolean attribute and the value is true. This is the case for the 'abstract' attribute in the feature 'Computer'. We also use attribues to indicate the power consumption of different parts of the computer.",
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
    text: "We can now create more complex constraints and for example access attribtues of features. In this case we use the aggregate function 'sum' to sum over all powerConsumption attributes and check if the overall powerConsumption is larger than a threshold and if so enforce a stronger power supply unit. You could also access feature attribtues and perform basic calculations with them.",
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
    text: "Group cardinalities are more generic than 'or' and 'alternative'. In our example the motherboard only has space for up to 2 SATA-Devices. So we enforce that there are 0, 1, or 2 SATA-Devices.",
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
    text: "Feature Cardinality allows a feature to be selected multiple times. In our example we can use up to 4 ram bars.",
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
    text: "In UVL you can use types to create special features. In this case we change the power supply unit. It has a 'Manufacturer' feature of the type 'String' and a 'Watt' feature of the type 'Integer'. This means, when configuring the feature model, the features are not just selected or deselected, but get a value of their coresponding type. We can utilize this for even more complex constraints and check if the manufaturer of the CPU and the PSU match.",
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
    text: "Now you have a basic understanding of the Universal Variablity Language. Go on and use the playground to test the language. If you plan on using the language more frequently we recommend installing an extension in an IDE of your choice, because it provides more features. Press the 'Done' button to close the tutorial."
}]