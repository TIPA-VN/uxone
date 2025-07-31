/**
 * Quantity formatting utility for JDE inventory data
 * 
 * Rules:
 * 1. All quantities are divided by 100 (JDE internal format)
 * 2. If UOM is not metric/imperial, don't use decimals
 * 3. Otherwise use 2 decimal places
 */

// Non-decimal UOMs (items that shouldn't show decimal places)
const NON_DECIMAL_UOMS = [
  'EA',   // Each
  'PCS',  // Pieces
  'UNT',  // Units
  'SET',  // Sets
  'BOX',  // Boxes
  'CASE', // Cases
  'PACK', // Packs
  'BAG',  // Bags
  'ROLL', // Rolls
  'BOTTLE', // Bottles
  'CAN',  // Cans
  'JAR',  // Jars
  'TUBE', // Tubes
  'BUNDLE', // Bundles
  'PALLET', // Pallets
  'CONTAINER', // Containers
  'DRUM', // Drums
  'BARREL', // Barrels
  'TANK', // Tanks
  'CYLINDER', // Cylinders
  'COIL', // Coils
  'REEL', // Reels
  'SPOOL', // Spools
  'BOLT', // Bolts
  'SHEET', // Sheets
  'PANEL', // Panels
  'PLATE', // Plates
  'BLOCK', // Blocks
  'SLAB',  // Slabs
  'TILE',  // Tiles
  'BRICK', // Bricks
  'BEAM',  // Beams
  'POST',  // Posts
  'POLE',  // Poles
  'PIPE',  // Pipes
  'TUBE',  // Tubes
  'WIRE',  // Wires
  'CABLE', // Cables
  'CHAIN', // Chains
  'ROPE',  // Ropes
  'BELT',  // Belts
  'HOSE',  // Hoses
  'VALVE', // Valves
  'PUMP',  // Pumps
  'MOTOR', // Motors
  'ENGINE', // Engines
  'COMPRESSOR', // Compressors
  'GENERATOR', // Generators
  'TRANSFORMER', // Transformers
  'SWITCH', // Switches
  'RELAY', // Relays
  'FUSE',  // Fuses
  'BREAKER', // Circuit Breakers
  'CONTACTOR', // Contactors
  'SENSOR', // Sensors
  'GAUGE', // Gauges
  'METER', // Meters
  'INDICATOR', // Indicators
  'DISPLAY', // Displays
  'SCREEN', // Screens
  'KEYBOARD', // Keyboards
  'MOUSE', // Mice
  'PRINTER', // Printers
  'SCANNER', // Scanners
  'CAMERA', // Cameras
  'LENS',  // Lenses
  'FILTER', // Filters
  'LAMP',  // Lamps
  'BULB',  // Bulbs
  'LED',   // LEDs
  'BATTERY', // Batteries
  'CHARGER', // Chargers
  'ADAPTER', // Adapters
  'CONNECTOR', // Connectors
  'TERMINAL', // Terminals
  'SOCKET', // Sockets
  'PLUG',  // Plugs
  'CORD',  // Cords
  'HARNESS', // Harnesses
  'ASSEMBLY', // Assemblies
  'KIT',   // Kits
  'MODULE', // Modules
  'BOARD', // Boards
  'CARD',  // Cards
  'CHIP',  // Chips
  'PROCESSOR', // Processors
  'MEMORY', // Memory
  'STORAGE', // Storage
  'DRIVE', // Drives
  'DISC',  // Discs
  'TAPE',  // Tapes
  'CASSETTE', // Cassettes
  'CARTRIDGE', // Cartridges
  'TANK',  // Tanks
  'BOTTLE', // Bottles
  'JAR',   // Jars
  'CAN',   // Cans
  'TUBE',  // Tubes
  'TUBE',  // Tubes
  'BAG',   // Bags
  'PACK',  // Packs
  'BOX',   // Boxes
  'CASE',  // Cases
  'PALLET', // Pallets
  'CONTAINER', // Containers
  'DRUM',  // Drums
  'BARREL', // Barrels
  'CYLINDER', // Cylinders
  'COIL',  // Coils
  'REEL',  // Reels
  'SPOOL', // Spools
  'BOLT',  // Bolts
  'SHEET', // Sheets
  'PANEL', // Panels
  'PLATE', // Plates
  'BLOCK', // Blocks
  'SLAB',  // Slabs
  'TILE',  // Tiles
  'BRICK', // Bricks
  'BEAM',  // Beams
  'POST',  // Posts
  'POLE',  // Poles
  'PIPE',  // Pipes
  'WIRE',  // Wires
  'CABLE', // Cables
  'CHAIN', // Chains
  'ROPE',  // Ropes
  'BELT',  // Belts
  'HOSE',  // Hoses
  'VALVE', // Valves
  'PUMP',  // Pumps
  'MOTOR', // Motors
  'ENGINE', // Engines
  'COMPRESSOR', // Compressors
  'GENERATOR', // Generators
  'TRANSFORMER', // Transformers
  'SWITCH', // Switches
  'RELAY', // Relays
  'FUSE',  // Fuses
  'BREAKER', // Circuit Breakers
  'CONTACTOR', // Contactors
  'SENSOR', // Sensors
  'GAUGE', // Gauges
  'METER', // Meters
  'INDICATOR', // Indicators
  'DISPLAY', // Displays
  'SCREEN', // Screens
  'KEYBOARD', // Keyboards
  'MOUSE', // Mice
  'PRINTER', // Printers
  'SCANNER', // Scanners
  'CAMERA', // Cameras
  'LENS',  // Lenses
  'FILTER', // Filters
  'LAMP',  // Lamps
  'BULB',  // Bulbs
  'LED',   // LEDs
  'BATTERY', // Batteries
  'CHARGER', // Chargers
  'ADAPTER', // Adapters
  'CONNECTOR', // Connectors
  'TERMINAL', // Terminals
  'SOCKET', // Sockets
  'PLUG',  // Plugs
  'CORD',  // Cords
  'HARNESS', // Harnesses
  'ASSEMBLY', // Assemblies
  'KIT',   // Kits
  'MODULE', // Modules
  'BOARD', // Boards
  'CARD',  // Cards
  'CHIP',  // Chips
  'PROCESSOR', // Processors
  'MEMORY', // Memory
  'STORAGE', // Storage
  'DRIVE', // Drives
  'DISC',  // Discs
  'TAPE',  // Tapes
  'CASSETTE', // Cassettes
  'CARTRIDGE', // Cartridges
];

/**
 * Check if a UOM should not display decimal places
 */
function isNonDecimalUOM(uom: string): boolean {
  if (!uom) return false;
  const cleanUOM = uom.trim().toUpperCase();
  return NON_DECIMAL_UOMS.includes(cleanUOM);
}

/**
 * Format quantity based on UOM rules
 * @param quantity - Raw quantity from JDE (needs to be divided by 100)
 * @param uom - Unit of measure
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: number, uom: string): string {
  // Step 1: Divide by 100 (JDE internal format)
  const adjustedQuantity = quantity / 100;
  
  // Step 2: Check if UOM should not use decimals
  if (isNonDecimalUOM(uom)) {
    // Round to nearest whole number for non-decimal UOMs
    return Math.round(adjustedQuantity).toLocaleString();
  }
  
  // Step 3: Use 2 decimal places for metric/imperial UOMs
  return adjustedQuantity.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format quantity for display with UOM
 * @param quantity - Raw quantity from JDE
 * @param uom - Unit of measure
 * @returns Formatted string with quantity and UOM
 */
export function formatQuantityWithUOM(quantity: number, uom: string): string {
  const formattedQuantity = formatQuantity(quantity, uom);
  const cleanUOM = uom?.trim() || 'EA';
  return `${formattedQuantity} ${cleanUOM}`;
}

/**
 * Format quantity for table display (just the number)
 * @param quantity - Raw quantity from JDE
 * @param uom - Unit of measure
 * @returns Formatted quantity string
 */
export function formatQuantityForTable(quantity: number, uom: string): string {
  return formatQuantity(quantity, uom);
}

/**
 * Get the number of decimal places for a UOM
 * @param uom - Unit of measure
 * @returns Number of decimal places (0 or 2)
 */
export function getDecimalPlaces(uom: string): number {
  return isNonDecimalUOM(uom) ? 0 : 2;
} 