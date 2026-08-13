import { useState, type ReactNode } from 'react'
import { CARGOS, NOMES_CARGO, itensDeCargo, type Cargo } from '@/types/domain'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface RankingCandidatosTabsProps {
  cargos?: readonly Cargo[]
  children: (cargo: Cargo) => ReactNode
}

// Shell de seleção de cargo reaproveitado nas telas de Estado, Zona
// e Local de Votação (Seções 4.4 e 4.6). Em telas largas usa Tabs;
// em mobile vira um Select (Seção 4.9 — mesmo padrão adotado para o
// seletor de nível de agregação da Tela 4).
export function RankingCandidatosTabs({ cargos = CARGOS, children }: RankingCandidatosTabsProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [cargoMobile, setCargoMobile] = useState<Cargo>(cargos[0])

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Select
          value={cargoMobile}
          onValueChange={(v) => v && setCargoMobile(v as Cargo)}
          items={itensDeCargo(cargos)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cargos.map((cargo) => (
              <SelectItem key={cargo} value={cargo}>
                {NOMES_CARGO[cargo]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {children(cargoMobile)}
      </div>
    )
  }

  return (
    <Tabs defaultValue={cargos[0]}>
      <TabsList>
        {cargos.map((cargo) => (
          <TabsTrigger key={cargo} value={cargo}>
            {NOMES_CARGO[cargo]}
          </TabsTrigger>
        ))}
      </TabsList>
      {cargos.map((cargo) => (
        <TabsContent key={cargo} value={cargo}>
          {children(cargo)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
