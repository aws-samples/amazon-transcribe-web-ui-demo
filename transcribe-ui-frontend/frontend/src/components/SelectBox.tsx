import React, { useState } from 'react'
import { Select } from 'aws-northstar/components'

type Option = {
  label: string
  value: string
}

type SelectBoxProps = {
  options: Option[]
  value?: string
  onChange: (option: string) => void
}

const SelectBox: React.FC<SelectBoxProps> = ({
  options,
  value,
  onChange
}: SelectBoxProps) => {
  const [selectedOption, setSeletedOption] = useState<Option>(
    options.find((item) => item.value === value) || options[0]
  )
  const _onChange = (
    event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>
  ) => {
    const changedOption = options.find(
      (item) => item.value === event.target.value
    )
    if (changedOption) {
      setSeletedOption(changedOption)
      onChange(changedOption['value'])
    }
  }

  return (
    <Select
      options={options}
      selectedOption={selectedOption}
      onChange={_onChange}
    />
  )
}

export default SelectBox
