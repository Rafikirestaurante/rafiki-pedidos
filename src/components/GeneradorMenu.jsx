import React from "react";

export default function GeneradorMenu() {
  return (
    <div className="min-h-screen bg-[#f8f4ee] p-4 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 border border-orange-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold">@Rafiki.baq</div>
          <img
            src="/logo-rafiki.png"
            alt="Rafiki"
            className="h-24 object-contain"
          />
          <div className="text-xl font-bold">3022915098</div>
        </div>

        {/* Title */}
        <h1 className="text-center text-5xl font-bold text-orange-500 mb-8">
          Nuestro menú del día
        </h1>

        {/* Products */}
        <div className="border border-orange-300 rounded-2xl overflow-hidden mb-8">
          {[
            ["Carne en posta en salsa de tocineta", "$20.000"],
            ["Pastas con pollo en salsa 4 quesos", "$18.000"],
            ["Chuleta de cerdo", "$19.000"],
            ["Pechuga o cerdo en crema de cebolla puerro", "$16.000"],
          ].map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_180px] border-b border-orange-200"
            >
              <div className="p-4 font-bold text-xl">{item[0]}</div>
              <div className="p-4 text-center text-3xl font-bold text-orange-600">
                {item[1]}
              </div>
            </div>
          ))}
        </div>

        {/* Extras */}
        <div className="mb-8">
          <h2 className="text-3xl text-orange-500 font-bold mb-4">
            También tenemos
          </h2>

          <div className="border border-orange-200 rounded-xl p-4 text-2xl font-bold flex justify-between">
            <span>Mote de queso</span>
            <span className="text-orange-600">$16.000</span>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-6 items-start">
          <div>
            <h2 className="text-3xl text-orange-500 font-bold mb-4">
              Acompañantes
            </h2>

            <ul className="space-y-2 text-2xl font-bold">
              <li>• Arroz de maíz</li>
              <li>• Puré papa o lentejas</li>
              <li>• Ensalada verde o remolacha</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold mb-2">Para llevar</div>
            <div className="text-xl">Tiene un costo de</div>
            <div className="text-5xl text-orange-600 font-bold my-2">
              $1.500
            </div>
            <div className="text-xl">Adicional por los desechables</div>
          </div>
        </div>
      </div>
    </div>
  );
}
